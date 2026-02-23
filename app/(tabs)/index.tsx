import { StyleSheet, useColorScheme, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import LocationBottomSheet from '@/components/LocationBottomSheet';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].text;
  const inputBackgroundColor = theme === 'dark' ? '#2C2C2E' : '#E5E5EA'; // iOS-like system gray
  const textColor = Colors[theme].text;

  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'current' | 'pickup'>('pickup');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    rotation.value = withTiming(isSheetOpen ? 180 : 0, { duration: 300 });
  }, [isSheetOpen]);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.expand();
    setIsSheetOpen(true);
  };

  const handleSelectMode = (mode: 'current' | 'pickup') => {
    setDeliveryMode(mode);
    setIsSheetOpen(false);
  };

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      setIsSheetOpen(false);
    }
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
          <TouchableOpacity
            style={[styles.locationContainer, { backgroundColor: Colors[theme].tint + '15' }]}
            onPress={handleOpenBottomSheet}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
               {deliveryMode === 'current' ? (
                 <IconSymbol name="location.fill" size={18} color={Colors[theme].tint} />
               ) : (
                 <IconSymbol name="bag.fill" size={18} color={Colors[theme].tint} />
               )}
            </View>
            <View style={styles.locationTextContainer}>
                <Text style={[styles.deliveryLabel, { color: Colors[theme].icon }]}>Entregar ahora</Text>
                <Text style={[styles.locationText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                  {displayText}
                </Text>
            </View>
            <Animated.View style={[styles.chevron, animatedStyle]}>
              <IconSymbol name="chevron.down" size={20} color={Colors[theme].tint} />
            </Animated.View>
          </TouchableOpacity>
          <IconSymbol name="person.crop.circle" size={36} color={iconColor} />
        </View>
      </SafeAreaView>
      <LocationBottomSheet
        bottomSheetRef={bottomSheetRef}
        onSelect={handleSelectMode}
        onChange={handleSheetChange}
        selectedMode={deliveryMode}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    marginRight: 12,
  },
  iconWrapper: {
     justifyContent: 'center',
     alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deliveryLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 0,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  locationText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chevron: {
    // Spacer if needed
  }
});
