import { StyleSheet, useColorScheme, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import * as Location from 'expo-location';
import { useState, useEffect, useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import LocationBottomSheet from '@/components/LocationBottomSheet';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].text;
  const inputBackgroundColor = theme === 'dark' ? '#2C2C2E' : '#E5E5EA'; // iOS-like system gray
  const textColor = Colors[theme].text;

  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'current' | 'pickup'>('pickup');

  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }

      try {
        // Try to get last known position first for speed
        const lastKnownLocation = await Location.getLastKnownPositionAsync();
        let addressResponse = [];

        if (lastKnownLocation) {
             addressResponse = await Location.reverseGeocodeAsync({
              latitude: lastKnownLocation.coords.latitude,
              longitude: lastKnownLocation.coords.longitude,
            });

            if (addressResponse.length > 0) {
               const addr = addressResponse[0];
               const parts = [
                 addr.street,
                 addr.streetNumber,
                 addr.city,
               ].filter(Boolean);
               setLocationAddress(parts.join(' ') || 'Ubicación desconocida');
            }
        }

        // Get current position with balanced accuracy for better speed/battery
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResponse.length > 0) {
           const addr = addressResponse[0];
           // Construct a readable address string
           const parts = [
             addr.street,
             addr.streetNumber,
             addr.city,
           ].filter(Boolean);
           setLocationAddress(parts.join(' ') || 'Ubicación desconocida');
        } else {
           // Only set error if we don't have a previous address
           if (!locationAddress) {
               setLocationAddress('Dirección no encontrada');
           }
        }
      } catch (e) {
        setErrorMsg('Error al obtener ubicación');
      }
    }

    if (deliveryMode === 'current') {
        getCurrentLocation();
    }
  }, [deliveryMode]);

  const handleOpenBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const handleSelectMode = (mode: 'current' | 'pickup') => {
    setDeliveryMode(mode);
  };

  let displayText = 'Cargando ubicación...';
  if (deliveryMode === 'pickup') {
      displayText = 'Recogida en tienda';
  } else {
    if (errorMsg) {
        displayText = errorMsg;
    } else if (locationAddress) {
        displayText = locationAddress;
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.locationWrapper}>
            <TouchableOpacity
              onPress={handleOpenBottomSheet}
              activeOpacity={0.7}
            >
              <Text style={[styles.deliveryLabel, { color: Colors[theme].icon }]}>Deliver now</Text>
              <View style={styles.locationRow}>
                <Text style={[styles.locationText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                  {displayText}
                </Text>
                <IconSymbol name="chevron.down" size={20} color={Colors[theme].icon} style={styles.chevron} />
              </View>
            </TouchableOpacity>
          </View>
          <IconSymbol name="person.crop.circle" size={32} color={iconColor} />
        </View>
      </SafeAreaView>
      <LocationBottomSheet bottomSheetRef={bottomSheetRef} onSelect={handleSelectMode} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  locationWrapper: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  deliveryLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  chevron: {
    marginLeft: 4,
  }
});
