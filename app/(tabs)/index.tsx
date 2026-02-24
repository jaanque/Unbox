import { StyleSheet, Alert, TouchableOpacity, ActivityIndicator, View, TextInput, ScrollView, Image } from 'react-native';
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
import { EndingSoonSection } from '@/components/EndingSoonSection';
import { CategoriesSection } from '@/components/CategoriesSection';

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

  const selectedMode: DeliveryMode = deliveryMode === 'Recogida en tienda' ? 'Recogida en tienda' : 'Ubicación actual';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <ThemedView style={styles.header}>
          <TouchableOpacity
            onPress={openBottomSheet}
            style={styles.locationContainer}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={iconColor} />
            ) : (
              <View style={styles.locationRow}>
                <View style={styles.locationIconBg}>
                   <IconSymbol name="location.fill" size={16} color={Colors[theme].tint} />
                </View>
                <View>
                  <ThemedText style={styles.prefixText}>Tu ubicación</ThemedText>
                  <View style={styles.locationTextRow}>
                    <ThemedText type="title" numberOfLines={1} style={styles.locationText}>
                      {deliveryMode}
                    </ThemedText>
                    <IconSymbol name="chevron.down" size={12} color={Colors[theme].text} style={styles.chevron} />
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={18} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              placeholder="Busca comida, locales..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
        </ThemedView>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContentContainer}>
          <CategoriesSection />
          <EndingSoonSection />

          {/* Example of additional section for comprehensive feel */}
          <View style={styles.promoBanner}>
             <ThemedText style={styles.promoText}>¡Salva comida hoy!</ThemedText>
             <ThemedText style={styles.promoSubtext}>Ayuda al planeta mientras ahorras.</ThemedText>
          </View>
        </ScrollView>
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
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
    gap: 16,
  },
  locationContainer: {
    marginBottom: 0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8, // Square slight round
    backgroundColor: '#EFF6FF', // Light blue tint
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
    maxWidth: 200,
  },
  chevron: {
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8, // Square slight round
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#11181C',
    paddingVertical: 0,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  promoBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#ECFDF5', // Light green
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  promoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 4,
  },
  promoSubtext: {
    fontSize: 14,
    color: '#047857',
  },
});
