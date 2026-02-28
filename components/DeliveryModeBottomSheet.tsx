import { supabase } from '@/lib/supabase';
import BottomSheet, { BottomSheetBackdrop, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import MapView, { Region } from './NativeMap';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type DeliveryMode = 'Recogida en tienda' | 'Ubicación actual' | 'Dirección personalizada' | 'Mapa' | 'Dirección guardada';

export interface DeliverySelection {
  mode: DeliveryMode;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface SavedAddress {
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
}

interface DeliveryModeBottomSheetProps {
  selectedMode: DeliveryMode;
  onSelect: (selection: DeliverySelection) => void;
  onClose: () => void;
  allowedModes?: DeliveryMode[];
}

type SheetView = 'options' | 'address-input' | 'map-select';

export const DeliveryModeBottomSheet = forwardRef<BottomSheet, DeliveryModeBottomSheetProps>(
  ({ selectedMode, onSelect, onClose, allowedModes }, ref) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    
    const snapPoints = useMemo(() => ['55%', '92%'], []);

    // --- ESTADOS ---
    const [currentView, setCurrentView] = useState<SheetView>('options');
    const [addressQuery, setAddressQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region | null>(null);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [saveAddress, setSaveAddress] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [isFetchingCurrentLocation, setIsFetchingCurrentLocation] = useState(false);

    useEffect(() => {
        fetchSavedAddresses();
    }, []);

    // --- LOGICA DE DATOS ---
    const fetchSavedAddresses = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('user_addresses')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });
                if (data) setSavedAddresses(data);
            }
        } catch (e) { console.error(e); }
    };

    const saveNewAddress = async (name: string, address: string, lat?: number, lon?: number) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await supabase.from('user_addresses').insert({
                user_id: session.user.id,
                name: name || address.split(',')[0],
                address: address,
                latitude: lat,
                longitude: lon
            });
        } catch (e) { console.error(e); }
    };

    // --- MANEJADORES ---
    const handleSheetChanges = (index: number) => {
        if (index === -1) {
            setCurrentView('options');
            setAddressQuery('');
            fetchSavedAddresses();
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentView('options');
        (ref as any)?.current?.snapToIndex(0);
    };

    const handleUseCurrentLocation = async () => {
        setIsFetchingCurrentLocation(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Activa la ubicación en los ajustes del teléfono.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const reverse = await Location.reverseGeocodeAsync(location.coords);
            let addrStr = "Ubicación actual";

            if (reverse[0]) {
                const { street, streetNumber, name, city } = reverse[0];
                
                // Lógica para incluir número de calle: 
                // Si streetNumber no existe, usamos 'name' que suele traer la dirección completa.
                const addressLine = streetNumber 
                    ? `${street} ${streetNumber}` 
                    : (name && name !== street ? name : street);

                addrStr = [addressLine, city].filter(Boolean).join(', ') || addrStr;
            }
            
            onSelect({ mode: 'Ubicación actual', address: addrStr, location: location.coords });
            onClose();
        } catch (e) { 
            Alert.alert('Error', 'No se pudo obtener la ubicación.'); 
        } finally { 
            setIsFetchingCurrentLocation(false); 
        }
    };

    const initializeMap = async () => {
        setLoading(true);
        (ref as any)?.current?.expand();
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            const loc = (status === 'granted') ? await Location.getCurrentPositionAsync({}) : { coords: { latitude: 41.6167, longitude: 0.6222 } };
            setMapRegion({ ...loc.coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
        } finally { setLoading(false); }
    };

    const handleConfirmAddress = async () => {
        if (!addressQuery.trim()) return;
        setLoading(true);
        Keyboard.dismiss();
        try {
            const geocoded = await Location.geocodeAsync(addressQuery);
            if (geocoded.length > 0) {
                const loc = geocoded[0];
                if (saveAddress) await saveNewAddress(saveName, addressQuery, loc.latitude, loc.longitude);
                onSelect({ mode: 'Dirección personalizada', address: addressQuery, location: loc });
                onClose();
            } else { Alert.alert('Error', 'Dirección no encontrada.'); }
        } catch (e) { Alert.alert('Error', 'Problema al buscar dirección.'); }
        finally { setLoading(false); }
    };

    const handleConfirmMapLocation = async () => {
        if (!mapRegion) return;
        setLoading(true);
        try {
            const reverse = await Location.reverseGeocodeAsync(mapRegion);
            let addrStr = 'Punto en el mapa';

            if (reverse[0]) {
                const { street, streetNumber, name, city } = reverse[0];
                
                // Aplicamos la misma lógica de construcción de dirección
                const addressLine = streetNumber 
                    ? `${street} ${streetNumber}` 
                    : (name && name !== street ? name : street);

                addrStr = [addressLine, city].filter(Boolean).join(', ') || addrStr;
            }

            if (saveAddress) await saveNewAddress(saveName, addrStr, mapRegion.latitude, mapRegion.longitude);
            onSelect({ mode: 'Mapa', address: addrStr, location: mapRegion });
            onClose();
        } finally { 
            setLoading(false); 
        }
    };

    const handleSelectSavedAddress = (addr: SavedAddress) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelect({ 
            mode: 'Dirección guardada', 
            address: addr.address, 
            location: (addr.latitude && addr.longitude) ? { latitude: addr.latitude, longitude: addr.longitude } : undefined 
        });
        onClose();
    };

    // --- RENDERS ---
    const renderOptions = () => (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
            {(!allowedModes || allowedModes.includes('Ubicación actual')) && (
                <TouchableOpacity style={styles.mainCard} onPress={handleUseCurrentLocation} activeOpacity={0.8}>
                    <View style={styles.optionLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                            {isFetchingCurrentLocation ? <ActivityIndicator size="small" color="#4F46E5" /> : <IconSymbol name="location.fill" size={22} color="#4F46E5" />}
                        </View>
                        <View style={styles.textContainer}>
                            <ThemedText style={styles.optionTitle}>Ubicación actual</ThemedText>
                            <ThemedText style={styles.optionSubtitle}>Usar el GPS de mi dispositivo</ThemedText>
                        </View>
                    </View>
                    {selectedMode === 'Ubicación actual' && <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />}
                </TouchableOpacity>
            )}

            {savedAddresses.length > 0 && (
                <View style={styles.sectionDivider}>
                    <ThemedText style={styles.sectionLabel}>TUS DIRECCIONES</ThemedText>
                    {savedAddresses.map((addr) => (
                        <TouchableOpacity key={addr.id} style={styles.addressRow} onPress={() => handleSelectSavedAddress(addr)}>
                            <View style={[styles.iconBoxSmall, { backgroundColor: '#F5F3FF' }]}>
                                <IconSymbol name="heart.fill" size={16} color="#7C3AED" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.savedName}>{addr.name}</ThemedText>
                                <ThemedText style={styles.savedDetail} numberOfLines={1}>{addr.address}</ThemedText>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.sectionDivider}>
                <ThemedText style={styles.sectionLabel}>MÁS OPCIONES</ThemedText>
                
                <TouchableOpacity style={styles.addressRow} onPress={() => { setCurrentView('address-input'); (ref as any)?.current?.expand(); }}>
                    <View style={[styles.iconBoxSmall, { backgroundColor: '#F3F4F6' }]}>
                        <IconSymbol name="magnifyingglass" size={16} color="#4B5563" />
                    </View>
                    <ThemedText style={styles.savedName}>Escribir dirección manualmente</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addressRow} onPress={() => { setCurrentView('map-select'); initializeMap(); }}>
                    <View style={[styles.iconBoxSmall, { backgroundColor: '#FFF7ED' }]}>
                        <IconSymbol name="location.fill" size={16} color="#EA580C" />
                    </View>
                    <ThemedText style={styles.savedName}>Elegir en el mapa</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addressRow} onPress={() => { onSelect({ mode: 'Recogida en tienda' }); onClose(); }}>
                    <View style={[styles.iconBoxSmall, { backgroundColor: '#ECFDF5' }]}>
                        <IconSymbol name="bag.fill" size={16} color="#059669" />
                    </View>
                    <ThemedText style={styles.savedName}>Recoger en tienda (Gratis)</ThemedText>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={currentView === 'options'}
        onChange={handleSheetChanges}
        backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />}
        backgroundStyle={{ backgroundColor: '#f8f6f6' }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 45 }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View style={styles.sheetHeader}>
            {currentView !== 'options' && (
                <TouchableOpacity onPress={handleBack} style={styles.circularBack}>
                    <IconSymbol name="chevron.left" size={20} color="#333" />
                </TouchableOpacity>
            )}
            <ThemedText style={styles.headerTitle}>
              {currentView === 'options' ? 'Entrega' : currentView === 'address-input' ? 'Dirección' : 'Mapa'}
            </ThemedText>
          </View>

          {currentView === 'options' && renderOptions()}

          {currentView === 'address-input' && (
              <View style={styles.subViewContainer}>
                  <View style={styles.inputWrapper}>
                      <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" style={{marginRight: 12}} />
                      <BottomSheetTextInput
                          style={styles.chunkyInput}
                          placeholder="Calle, número, ciudad..."
                          value={addressQuery}
                          onChangeText={setAddressQuery}
                          autoFocus
                      />
                  </View>
                  <View style={styles.saveToggleCard}>
                      <View style={styles.switchRow}>
                          <ThemedText style={styles.switchLabel}>Guardar para después</ThemedText>
                          <Switch value={saveAddress} onValueChange={setSaveAddress} trackColor={{ true: '#333' }} />
                      </View>
                      {saveAddress && (
                           <BottomSheetTextInput style={styles.innerInput} placeholder="Nombre (ej: Casa, Gym)" value={saveName} onChangeText={setSaveName} />
                      )}
                  </View>
                  <TouchableOpacity style={[styles.primaryButton, { opacity: addressQuery.trim() ? 1 : 0.5 }]} onPress={handleConfirmAddress} disabled={!addressQuery.trim() || loading}>
                      {loading ? <ActivityIndicator color="white" /> : <ThemedText style={styles.buttonText}>Confirmar dirección</ThemedText>}
                  </TouchableOpacity>
              </View>
          )}

          {currentView === 'map-select' && (
              <View style={styles.subViewContainer}>
                  <View style={styles.mapContainer}>
                      {mapRegion ? (
                          <MapView style={{flex:1}} initialRegion={mapRegion} onRegionChangeComplete={setMapRegion} showsUserLocation />
                      ) : (
                          <ActivityIndicator size="large" color="#333" style={{marginTop: 100}} />
                      )}
                      <View style={styles.centerPin} pointerEvents="none">
                          <IconSymbol name="location.fill" size={36} color="#333" />
                      </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmMapLocation}>
                      <ThemedText style={styles.buttonText}>Confirmar este punto</ThemedText>
                  </TouchableOpacity>
              </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, marginBottom: 5 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#11181C', letterSpacing: -0.5 },
  circularBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40, gap: 18 },
  mainCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 22, padding: 18, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  iconBoxSmall: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '800', color: '#11181C' },
  optionSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  sectionDivider: { gap: 12, marginTop: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.2, marginLeft: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 18, gap: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  savedName: { fontSize: 15, fontWeight: '700', color: '#11181C' },
  savedDetail: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  subViewContainer: { padding: 20, gap: 20, flex: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#E5E7EB' },
  chunkyInput: { flex: 1, fontSize: 16, fontWeight: '600', color: '#11181C' },
  saveToggleCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  innerInput: { marginTop: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', fontSize: 14, fontWeight: '600' },
  primaryButton: { backgroundColor: '#11181C', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  mapContainer: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 300 },
  centerPin: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', paddingBottom: 36 },
});

DeliveryModeBottomSheet.displayName = 'DeliveryModeBottomSheet';