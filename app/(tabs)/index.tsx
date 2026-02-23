import { StyleSheet, Alert, TouchableOpacity } from 'react-native';
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
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Permite el acceso a la ubicación para usar esta función.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        setDeliveryMode(`${address.street}, ${address.streetNumber || ''}`);
      } else {
        setDeliveryMode('Ubicación actual');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    }
  };

  const onSelectDeliveryMode = (mode: DeliveryMode) => {
    if (mode === 'Ubicación actual') {
      handleUseCurrentLocation();
    } else {
      setDeliveryMode(mode);
    }
    bottomSheetRef.current?.close();
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={openBottomSheet}>
            <ThemedText type="defaultSemiBold">{deliveryMode}</ThemedText>
          </TouchableOpacity>
          <IconSymbol name="person.crop.circle" size={28} color={iconColor} />
        </ThemedView>
      </SafeAreaView>
      <DeliveryModeBottomSheet
        ref={bottomSheetRef}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
