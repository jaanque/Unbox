import React, { forwardRef, useMemo, useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, ActivityIndicator, Keyboard, Platform, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from './NativeMap';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type DeliveryMode = 'Recogida en tienda' | 'Ubicación actual' | 'Dirección personalizada' | 'Mapa';

export interface DeliverySelection {
  mode: DeliveryMode;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
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
    // Snap points: Options (45%), Address/Map (85%)
    const snapPoints = useMemo(() => ['45%', '85%'], []);
    const [currentView, setCurrentView] = useState<SheetView>('options');
    const [addressQuery, setAddressQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region | null>(null);

    // Reset view when closed/opened
    useEffect(() => {
        // Ideally we reset when sheet closes, but doing it on mount is okay too.
    }, []);

    const handleSheetChanges = (index: number) => {
        if (index === -1) {
            setCurrentView('options');
            setAddressQuery('');
            setLoading(false);
        }
    };

    const handleSelectOption = (mode: DeliveryMode) => {
      Haptics.selectionAsync();
      if (mode === 'Dirección personalizada') {
        setCurrentView('address-input');
        // Expand sheet for input
        if (ref && 'expand' in ref) (ref as any).expand();
      } else if (mode === 'Mapa') {
        setCurrentView('map-select');
        initializeMap();
        // Expand sheet for map
        if (ref && 'expand' in ref) (ref as any).expand();
      } else {
        onSelect({ mode });
        onClose();
      }
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
                // Default fallback (e.g. Madrid center)
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

    const handleConfirmAddress = async () => {
        if (!addressQuery.trim()) return;
        setLoading(true);
        Keyboard.dismiss();
        try {
            const geocoded = await Location.geocodeAsync(addressQuery);
            if (geocoded && geocoded.length > 0) {
                const location = geocoded[0];
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
        // Snap back to smaller size if needed, but standardizing on medium height is fine.
        // We can create a method to snap to index 0 if needed.
        if (ref && 'snapToIndex' in ref) (ref as any).snapToIndex(0);
    };

    const activeColor = Colors[theme].text;
    const iconColor = Colors[theme].icon;
    const primaryColor = '#5A228B'; // From memory: Purple accent

    const renderOptions = () => (
        <View style={styles.listContainer}>
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
                         {/* map icon isn't in standard set, using location.fill as fallback or similar */}
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
                onChangeText={setAddressQuery}
                returnKeyType="search"
                onSubmitEditing={handleConfirmAddress}
                autoFocus
            />
            <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: addressQuery.trim() ? primaryColor : '#E5E7EB' }]}
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
                    {/* Fixed center pin */}
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
                <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: primaryColor }]}
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
                <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={10}>
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
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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
      paddingBottom: 40, // Offset to make pin tip center
  },
  mapFooter: {
      gap: 12,
  },
  mapHintText: {
      textAlign: 'center',
      fontSize: 13,
      color: '#6B7280',
  }
});
