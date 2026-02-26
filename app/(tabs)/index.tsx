import { StyleSheet, Alert, TouchableOpacity, ActivityIndicator, View, TextInput, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import BottomSheet from '@gorhom/bottom-sheet';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DeliveryModeBottomSheet, DeliveryMode, DeliverySelection } from '@/components/DeliveryModeBottomSheet';
import { EndingSoonSection } from '@/components/EndingSoonSection';
import { CategoriesSection } from '@/components/CategoriesSection';
import { AllPartnersSection } from '@/components/AllPartnersSection';
import { ClosestSection } from '@/components/ClosestSection';
import { TopRatedSection } from '@/components/TopRatedSection';
import { NewOffersSection } from '@/components/NewOffersSection';
import { CategoryOffersResult } from '@/components/CategoryOffersResult';
import { PartnerOffersResult } from '@/components/PartnerOffersResult';
import { SearchResults } from '@/components/SearchResults';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].icon;

  // State for display text (e.g. "Calle Gran Vía 1")
  const [deliveryAddressText, setDeliveryAddressText] = useState<string>('Ubicación actual');
  // State for internal mode tracking
  const [currentDeliveryMode, setCurrentDeliveryMode] = useState<DeliveryMode>('Ubicación actual');

  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; name: string } | null>(null);
  const [partnerCategoryId, setPartnerCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initial location fetch
  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    setCurrentDeliveryMode('Ubicación actual'); // Optimistic update
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Alert.alert('Permiso denegado', 'Permite el acceso a la ubicación para usar esta función.');
        // Don't alert on mount, just fallback silently or show default
        setDeliveryAddressText('Ubicación desconocida');
        setIsLoading(false);
        return;
      }

      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (location) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      // Reverse geocode to get friendly name
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
          setDeliveryAddressText(parts.join(', '));
        } else if (address.name) {
          setDeliveryAddressText(address.name);
        } else {
          setDeliveryAddressText(address.city || address.region || 'Ubicación actual');
        }
      } else {
        setDeliveryAddressText('Ubicación actual');
      }
    } catch (error) {
      console.error(error);
      // Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
      setDeliveryAddressText('Ubicación actual');
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectDeliveryMode = (selection: DeliverySelection) => {
    bottomSheetRef.current?.close();
    setCurrentDeliveryMode(selection.mode);

    if (selection.mode === 'Ubicación actual') {
      handleUseCurrentLocation();
    } else if (selection.mode === 'Recogida en tienda') {
      setDeliveryAddressText('Recogida en tienda');
    } else if (selection.mode === 'Dirección personalizada' || selection.mode === 'Mapa') {
        if (selection.address) {
            setDeliveryAddressText(selection.address);
        } else {
            setDeliveryAddressText('Ubicación seleccionada');
        }

        if (selection.location) {
            setUserLocation(selection.location);
        }
    }
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const handleSelectCategory = (id: string) => {
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(id);
      setSelectedPartner(null);
      setPartnerCategoryId(null);
      setSearchQuery('');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSelectPartner = (id: string, name: string) => {
      setSelectedPartner({ id, name });
      setSelectedCategoryId(null);
      setPartnerCategoryId(null);
      setSearchQuery('');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSelectPartnerCategory = (id: string) => {
      if (partnerCategoryId === id) {
          setPartnerCategoryId(null);
      } else {
          setPartnerCategoryId(id);
      }
  };

  const handleBackFromPartner = () => {
      setSelectedPartner(null);
      setPartnerCategoryId(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
              <View style={styles.centeredLocation}>
                <ThemedText style={styles.prefixText}>Entrega en</ThemedText>
                <View style={styles.locationTextRow}>
                  <ThemedText type="title" numberOfLines={1} style={styles.locationText}>
                    {deliveryAddressText}
                  </ThemedText>
                  <IconSymbol name="chevron.down" size={12} color={Colors[theme].text} style={styles.chevron} />
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
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                    <IconSymbol name="xmark.circle.fill" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            )}
          </View>
        </ThemedView>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors[theme].tint} />
          }
        >
          {searchQuery.length > 0 ? (
             <SearchResults query={searchQuery} userLocation={userLocation} onSelectPartner={handleSelectPartner} />
          ) : (
            <>
                {/* Only show global categories if NOT inside a partner view */}
                {!selectedPartner && (
                    <CategoriesSection selectedCategoryId={selectedCategoryId} onSelectCategory={handleSelectCategory} />
                )}

                {selectedCategoryId ? (
                    <CategoryOffersResult categoryId={selectedCategoryId} userLocation={userLocation} />
                ) : selectedPartner ? (
                    <PartnerOffersResult
                        partnerId={selectedPartner.id}
                        partnerName={selectedPartner.name}
                        categoryId={partnerCategoryId}
                        userLocation={userLocation}
                        onBack={handleBackFromPartner}
                        onSelectCategory={handleSelectPartnerCategory}
                    />
                ) : (
                    <>
                    <EndingSoonSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                    <ClosestSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                    <TopRatedSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                    <NewOffersSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                    <AllPartnersSection onSelect={handleSelectPartner} refreshTrigger={refreshTrigger} />
                    </>
                )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <DeliveryModeBottomSheet
        ref={bottomSheetRef}
        selectedMode={currentDeliveryMode}
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
    alignItems: 'center', // Center content horizontally
  },
  centeredLocation: {
    alignItems: 'center',
    gap: 2,
  },
  prefixText: {
    fontSize: 10, // slightly smaller prefix
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
    maxWidth: 240, // Increased width
    textAlign: 'center',
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
});
