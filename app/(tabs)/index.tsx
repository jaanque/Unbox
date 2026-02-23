import { StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import * as Location from 'expo-location';
import BottomSheet from '@gorhom/bottom-sheet';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DeliveryModeBottomSheet, DeliveryMode } from '@/components/DeliveryModeBottomSheet';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].icon;
  const [deliveryMode, setDeliveryMode] = useState<string>('Recogida en tienda');
  const [isLoading, setIsLoading] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Permite el acceso a la ubicación para usar esta función.');
        setIsLoading(false);
        return;
      }

      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.streetNumber) parts.push(address.streetNumber);

        if (parts.length > 0) {
          setDeliveryMode(parts.join(', '));
        } else if (address.name) {
          setDeliveryMode(address.name);
        } else {
          setDeliveryMode(address.city || address.region || 'Ubicación actual');
        }
      } else {
        setDeliveryMode('Ubicación actual');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectDeliveryMode = (mode: DeliveryMode) => {
    bottomSheetRef.current?.close();
    if (mode === 'Ubicación actual') {
      handleUseCurrentLocation();
    } else {
      setDeliveryMode(mode);
    }
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const leadingIconName = deliveryMode === 'Recogida en tienda' ? 'bag.fill' : 'location.fill';
  const selectedMode: DeliveryMode = deliveryMode === 'Recogida en tienda' ? 'Recogida en tienda' : 'Ubicación actual';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <TouchableOpacity
            onPress={openBottomSheet}
            style={styles.locationContainer}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={iconColor} />
            ) : (
              <>
                <ThemedText style={styles.prefixText}>Entregar en:</ThemedText>
                <IconSymbol name={leadingIconName} size={20} color={iconColor} style={styles.leadingIcon} />
                <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.locationText}>
                  {deliveryMode}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={iconColor} style={styles.chevron} />
              </>
            )}
          </TouchableOpacity>
          <IconSymbol name="person.crop.circle" size={32} color={iconColor} />
        </ThemedView>
      </SafeAreaView>
      <DeliveryModeBottomSheet
        ref={bottomSheetRef}
        selectedMode={selectedMode}
        onSelect={onSelectDeliveryMode}
        onClose={() => bottomSheetRef.current?.close()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  prefixText: {
    fontSize: 12,
    color: '#687076',
    marginRight: 8,
  },
  locationText: {
    flexShrink: 1,
    fontSize: 14,
  },
  leadingIcon: {
    marginRight: 6,
  },
  chevron: {
    marginLeft: 4,
  },
});
