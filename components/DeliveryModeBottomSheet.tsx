import React, { forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, ActivityIndicator, Keyboard, Platform, ScrollView, Alert, Switch } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import MapView, { Marker, Region } from './NativeMap';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
}

type SheetView = 'options' | 'address-input' | 'map-select';

export const DeliveryModeBottomSheet = forwardRef<BottomSheet, DeliveryModeBottomSheetProps>(
  ({ selectedMode, onSelect, onClose }, ref) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const snapPoints = useMemo(() => ['50%', '85%'], []);

    const [currentView, setCurrentView] = useState<SheetView>('options');
    const [addressQuery, setAddressQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region | null>(null);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<Location.LocationGeocodedLocation[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Save Address Logic
    const [saveAddress, setSaveAddress] = useState(false);
    const [saveName, setSaveName] = useState('');

    useEffect(() => {
        fetchSavedAddresses();
    }, []);

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
        } catch (e) {
            console.error(e);
        }
    };

    const handleSheetChanges = (index: number) => {
        if (index === -1) {
            setCurrentView('options');
            setAddressQuery('');
            setSuggestions([]);
            setLoading(false);
            setSaveAddress(false);
            setSaveName('');
            fetchSavedAddresses(); // Refresh on open
        }
    };

    // Autocomplete logic
    const handleAddressChange = (text: string) => {
        setAddressQuery(text);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                // Geocode returns coordinates, not addresses usually, but we can simulate search
                // by geocoding the string. It might return multiple candidates.
                // Note: Expo Location geocoding is limited.
                // Ideally use Google Places API, but we stick to expo-location as per constraints.
                const results = await Location.geocodeAsync(text);
                setSuggestions(results.slice(0, 5));
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        }, 800); // 800ms debounce
    };

    const handleSelectSuggestion = async (location: Location.LocationGeocodedLocation) => {
        setLoading(true);
        try {
            // Reverse geocode to get the clean address string for this coordinate
            const reverse = await Location.reverseGeocodeAsync({
                latitude: location.latitude,
                longitude: location.longitude
            });

            if (reverse && reverse.length > 0) {
                const addr = reverse[0];
                const parts = [];
                if (addr.street) parts.push(addr.street);
                if (addr.streetNumber) parts.push(addr.streetNumber);
                if (addr.city) parts.push(addr.city);

                const addressString = parts.length > 0 ? parts.join(', ') : (addr.name || 'Ubicación seleccionada');
                setAddressQuery(addressString); // Fill input

                // Confirm immediately? Or let user confirm?
                // UX: Let user verify and maybe save.
                setSuggestions([]); // Clear suggestions
                Keyboard.dismiss();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (mode: DeliveryMode) => {
      Haptics.selectionAsync();
      if (mode === 'Dirección personalizada') {
        setCurrentView('address-input');
        if (ref && 'expand' in ref) (ref as any).expand();
      } else if (mode === 'Mapa') {
        setCurrentView('map-select');
        initializeMap();
        if (ref && 'expand' in ref) (ref as any).expand();
      } else {
        onSelect({ mode });
        onClose();
      }
    };

    const handleSelectSavedAddress = (addr: SavedAddress) => {
        Haptics.selectionAsync();
        onSelect({
            mode: 'Dirección guardada',
            address: addr.address,
            location: (addr.latitude && addr.longitude) ? { latitude: addr.latitude, longitude: addr.longitude } : undefined
        });
        onClose();
    };

    const initializeMap = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setMapRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            } else {
                 setMapRegion({
                    latitude: 40.416775,
                    longitude: -3.703790,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            }
        } catch (e) {
             setMapRegion({
                latitude: 40.416775,
                longitude: -3.703790,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        } finally {
            setLoading(false);
        }
    };

    const saveNewAddress = async (name: string, address: string, lat?: number, lon?: number) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.from('user_addresses').insert({
                user_id: session.user.id,
                name: name || address.split(',')[0],
                address: address,
                latitude: lat,
                longitude: lon
            });
            if (error) console.error("Error saving address:", error);
        } catch (e) {
            console.error(e);
        }
    };

    const handleConfirmAddress = async () => {
        if (!addressQuery.trim()) return;
        setLoading(true);
        Keyboard.dismiss();
        try {
            const geocoded = await Location.geocodeAsync(addressQuery);
            if (geocoded && geocoded.length > 0) {
                const location = geocoded[0];

                if (saveAddress) {
                    await saveNewAddress(saveName, addressQuery, location.latitude, location.longitude);
                }

                onSelect({
                    mode: 'Dirección personalizada',
                    address: addressQuery,
                    location: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                });
                onClose();
            } else {
                alert('No se pudo encontrar la dirección.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al buscar la dirección.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmMapLocation = async () => {
        if (!mapRegion) return;
        setLoading(true);
        try {
            const reverseGeocoded = await Location.reverseGeocodeAsync({
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude
            });

            let addressString = 'Ubicación seleccionada';
            if (reverseGeocoded && reverseGeocoded.length > 0) {
                const addr = reverseGeocoded[0];
                const parts = [];
                if (addr.street) parts.push(addr.street);
                if (addr.streetNumber) parts.push(addr.streetNumber);
                if (addr.city) parts.push(addr.city);
                if (parts.length > 0) addressString = parts.join(', ');
                else if (addr.name) addressString = addr.name;
            }

            if (saveAddress) {
                await saveNewAddress(saveName, addressString, mapRegion.latitude, mapRegion.longitude);
            }

            onSelect({
                mode: 'Mapa',
                address: addressString,
                location: {
                    latitude: mapRegion.latitude,
                    longitude: mapRegion.longitude
                }
            });
            onClose();

        } catch (error) {
            console.error(error);
            onSelect({
                mode: 'Mapa',
                address: 'Ubicación en mapa',
                location: {
                    latitude: mapRegion.latitude,
                    longitude: mapRegion.longitude
                }
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setCurrentView('options');
        setSaveAddress(false);
        setSaveName('');
        setSuggestions([]);
        if (ref && 'snapToIndex' in ref) (ref as any).snapToIndex(0);
    };

    const activeColor = Colors[theme].text;
    const iconColor = Colors[theme].icon;
    const primaryColor = '#5A228B';

    const renderOptions = () => (
        <ScrollView contentContainerStyle={styles.listContainer}>
             {/* Option 1: Current Location (Default) */}
             <TouchableOpacity
                style={[styles.option, styles.optionBorder]}
                onPress={() => handleSelectOption('Ubicación actual')}
                activeOpacity={0.7}
            >
                <View style={styles.optionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
                         <IconSymbol name="location.fill" size={20} color="#4F46E5" />
                    </View>
                    <View>
                        <ThemedText style={styles.optionTitle}>Ubicación actual</ThemedText>
                        <ThemedText style={styles.optionSubtitle}>Usar GPS</ThemedText>
                    </View>
                </View>
                {selectedMode === 'Ubicación actual' && (
                    <IconSymbol name="checkmark" size={20} color={primaryColor} />
                )}
            </TouchableOpacity>

            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionHeaderText}>Direcciones guardadas</ThemedText>
                </View>
            )}

            {savedAddresses.map((addr) => (
                <TouchableOpacity
                    key={addr.id}
                    style={[styles.option, styles.optionBorder]}
                    onPress={() => handleSelectSavedAddress(addr)}
                    activeOpacity={0.7}
                >
                    <View style={styles.optionLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                             <IconSymbol name="heart.fill" size={20} color={primaryColor} />
                        </View>
                        <View>
                            <ThemedText style={styles.optionTitle}>{addr.name}</ThemedText>
                            <ThemedText style={styles.optionSubtitle} numberOfLines={1}>{addr.address}</ThemedText>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}

            <View style={styles.sectionHeader}>
                 <ThemedText style={styles.sectionHeaderText}>Añadir nueva</ThemedText>
            </View>

            {/* Option 2: Write Address */}
            <TouchableOpacity
                style={[styles.option, styles.optionBorder]}
                onPress={() => handleSelectOption('Dirección personalizada')}
                activeOpacity={0.7}
            >
                <View style={styles.optionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                         <IconSymbol name="magnifyingglass" size={20} color="#4B5563" />
                    </View>
                    <View>
                        <ThemedText style={styles.optionTitle}>Escribir dirección</ThemedText>
                        <ThemedText style={styles.optionSubtitle}>Calle, número, código postal...</ThemedText>
                    </View>
                </View>
                 {selectedMode === 'Dirección personalizada' && (
                    <IconSymbol name="checkmark" size={20} color={primaryColor} />
                )}
            </TouchableOpacity>

             {/* Option 3: Select on Map */}
             <TouchableOpacity
                style={[styles.option, styles.optionBorder]}
                onPress={() => handleSelectOption('Mapa')}
                activeOpacity={0.7}
            >
                <View style={styles.optionLeft}>
                     <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                         <IconSymbol name="location.fill" size={20} color="#D97706" />
                    </View>
                    <View>
                        <ThemedText style={styles.optionTitle}>Seleccionar en el mapa</ThemedText>
                        <ThemedText style={styles.optionSubtitle}>Elige el punto exacto</ThemedText>
                    </View>
                </View>
                 {selectedMode === 'Mapa' && (
                    <IconSymbol name="checkmark" size={20} color={primaryColor} />
                )}
            </TouchableOpacity>

            {/* Option 4: Store Pickup */}
            <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelectOption('Recogida en tienda')}
                activeOpacity={0.7}
            >
                <View style={styles.optionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                         <IconSymbol name="bag.fill" size={20} color="#059669" />
                    </View>
                    <View>
                        <ThemedText style={styles.optionTitle}>Recogida en tienda</ThemedText>
                        <ThemedText style={styles.optionSubtitle}>Ahórrate el envío</ThemedText>
                    </View>
                </View>
                {selectedMode === 'Recogida en tienda' && (
                    <IconSymbol name="checkmark" size={20} color={primaryColor} />
                )}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderSaveOptions = () => (
        <View style={styles.saveContainer}>
            <View style={styles.switchRow}>
                <ThemedText style={styles.switchLabel}>Guardar esta dirección</ThemedText>
                <Switch
                    value={saveAddress}
                    onValueChange={setSaveAddress}
                    trackColor={{ false: '#E5E7EB', true: primaryColor }}
                />
            </View>
            {saveAddress && (
                 <BottomSheetTextInput
                    style={[styles.input, { color: activeColor, borderColor: '#E5E7EB', marginTop: 12, marginBottom: 0 }]}
                    placeholder="Nombre (ej: Casa, Trabajo)"
                    placeholderTextColor="#9CA3AF"
                    value={saveName}
                    onChangeText={setSaveName}
                />
            )}
        </View>
    );

    const renderAddressInput = () => (
        <View style={styles.subViewContainer}>
            <ThemedText style={styles.subViewTitle}>¿Dónde quieres recibir tu pedido?</ThemedText>
            <BottomSheetTextInput
                style={[styles.input, { color: activeColor, borderColor: '#E5E7EB' }]}
                placeholder="Ej: Calle Gran Vía, 28, Madrid"
                placeholderTextColor="#9CA3AF"
                value={addressQuery}
                onChangeText={handleAddressChange}
                returnKeyType="search"
                onSubmitEditing={handleConfirmAddress}
                autoFocus
            />

            {/* Suggestions List */}
            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((sug, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectSuggestion(sug)}
                        >
                            <IconSymbol name="location.fill" size={16} color="#9CA3AF" />
                            <ThemedText style={styles.suggestionText}>
                                {`Lat: ${sug.latitude.toFixed(3)}, Lon: ${sug.longitude.toFixed(3)}`}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {renderSaveOptions()}

            <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: addressQuery.trim() ? primaryColor : '#E5E7EB', marginTop: 24 }]}
                onPress={handleConfirmAddress}
                disabled={!addressQuery.trim() || loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <ThemedText style={styles.confirmButtonText}>Confirmar dirección</ThemedText>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderMapSelect = () => (
        <View style={styles.subViewContainer}>
             {mapRegion ? (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={mapRegion}
                        onRegionChangeComplete={setMapRegion}
                        showsUserLocation
                        rotateEnabled={false}
                        pitchEnabled={false}
                    />
                    <View style={styles.centerPinContainer} pointerEvents="none">
                         <IconSymbol name="location.fill" size={40} color={primaryColor} />
                    </View>
                </View>
             ) : (
                 <View style={[styles.mapContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                     <ActivityIndicator size="large" color={primaryColor} />
                 </View>
             )}

            <View style={styles.mapFooter}>
                 <ThemedText style={styles.mapHintText}>Mueve el mapa para seleccionar la ubicación exacta</ThemedText>

                 {renderSaveOptions()}

                <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: primaryColor, marginTop: 12 }]}
                    onPress={handleConfirmMapLocation}
                    disabled={loading}
                >
                    {loading ? (
                         <ActivityIndicator color="white" />
                    ) : (
                        <ThemedText style={styles.confirmButtonText}>Confirmar ubicación</ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={currentView === 'options'}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        backgroundStyle={{ backgroundColor: Colors[theme].background }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.sheetHeader}>
            {currentView !== 'options' && (
                <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                     <IconSymbol name="chevron.down" size={24} color={activeColor} style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
            )}
            <ThemedText type="subtitle" style={styles.title}>
              {currentView === 'options' ? 'Modo de entrega' :
               currentView === 'address-input' ? 'Escribir dirección' : 'Seleccionar en mapa'}
            </ThemedText>
             {currentView !== 'options' && <View style={{ width: 24 }} />}
          </View>

          {currentView === 'options' && renderOptions()}
          {currentView === 'address-input' && renderAddressInput()}
          {currentView === 'map-select' && renderMapSelect()}

        </BottomSheetView>
      </BottomSheet>
    );
  }
);

DeliveryModeBottomSheet.displayName = 'DeliveryModeBottomSheet';

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
      padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#11181C',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    maxWidth: '90%',
  },
  sectionHeader: {
      paddingTop: 8,
      paddingBottom: 4,
  },
  sectionHeaderText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#9CA3AF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },
  subViewContainer: {
      flex: 1,
      padding: 16,
  },
  subViewTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
  },
  input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 24,
  },
  confirmButton: {
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
  },
  confirmButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
  },
  mapContainer: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      position: 'relative',
      minHeight: 300,
  },
  map: {
      width: '100%',
      height: '100%',
  },
  centerPinContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 40,
  },
  mapFooter: {
      gap: 12,
  },
  mapHintText: {
      textAlign: 'center',
      fontSize: 13,
      color: '#6B7280',
      marginBottom: 8,
  },
  saveContainer: {
      backgroundColor: '#F9FAFB',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
  },
  switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  switchLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4B5563',
  },
  suggestionsContainer: {
      marginBottom: 16,
      marginTop: -16, // pull up closer to input
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      backgroundColor: '#fff',
      maxHeight: 150,
  },
  suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
      fontSize: 14,
      color: '#4B5563',
  }
});
