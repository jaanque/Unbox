import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllPartnersSection } from '@/components/AllPartnersSection';
import { CategoriesSection } from '@/components/CategoriesSection';
import { CategoryOffersResult } from '@/components/CategoryOffersResult';
import { ClosestSection } from '@/components/ClosestSection';
import { DeliveryMode, DeliveryModeBottomSheet, DeliverySelection } from '@/components/DeliveryModeBottomSheet';
import { EndingSoonSection } from '@/components/EndingSoonSection';
import { NewOffersSection } from '@/components/NewOffersSection';
import { PartnerOffersResult } from '@/components/PartnerOffersResult';
import { SearchResults } from '@/components/SearchResults';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopRatedSection } from '@/components/TopRatedSection';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ExploreScreen() {
  const [deliveryAddressText, setDeliveryAddressText] = useState<string>('Ubicación actual');
  const [currentDeliveryMode, setCurrentDeliveryMode] = useState<DeliveryMode>('Ubicación actual');

  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; name: string } | null>(null);
  const [partnerCategoryId, setPartnerCategoryId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
    setCurrentDeliveryMode('Ubicación actual'); 
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDeliveryAddressText('Ubicación desconocida');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      if (location) {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        
        if (address.district) parts.push(address.district);
        else if (address.street) parts.push(address.street);
        
        if (address.city) parts.push(address.city);

        if (parts.length > 0) {
          setDeliveryAddressText(parts.join(', '));
        } else if (address.name) {
          setDeliveryAddressText(address.name);
        } else {
          setDeliveryAddressText('Ubicación actual');
        }
      } else {
        setDeliveryAddressText('Ubicación actual');
      }
    } catch (error) {
      console.error(error);
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
          {!isSearchActive ? (
            <>
              <TouchableOpacity
                onPress={openBottomSheet}
                style={styles.locationWrapper}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#1a3d2c" />
                ) : (
                  <View style={styles.locationContainer}>
                    <IconSymbol name="mappin.fill" size={20} color="#1a3d2c" />
                    <ThemedText numberOfLines={1} style={styles.locationText}>
                      {deliveryAddressText}
                    </ThemedText>
                    <IconSymbol name="chevron.down" size={14} color="#1a3d2c" style={styles.chevron} />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setIsSearchActive(true)} 
                activeOpacity={0.7}
                style={styles.searchButton}
              >
                <IconSymbol name="magnifyingglass" size={24} color="#1a3d2c" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.activeSearchContainer}>
              <View style={styles.searchBar}>
                <IconSymbol name="magnifyingglass" size={18} color="#6B7280" style={styles.searchBarIcon} />
                <TextInput
                  placeholder="Busca comida, locales..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                    <IconSymbol name="xmark.circle.fill" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsSearchActive(false);
                  setSearchQuery('');
                }}
                style={styles.cancelButton}
              >
                <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a3d2c" />
          }
        >
          {searchQuery.length > 0 ? (
             <SearchResults query={searchQuery} userLocation={userLocation} onSelectPartner={handleSelectPartner} />
          ) : (
            <>
                {/* Solamente se muestran las categorías globales si NO estamos dentro de un partner */}
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
    backgroundColor: '#f8f6f6',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f6f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f6f6',
  },
  locationWrapper: {
    flex: 1,
    marginRight: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3d2c',
    flexShrink: 1,
  },
  chevron: {
    marginTop: 2,
  },
  searchButton: {
    padding: 4,
  },
  activeSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#11181C',
    paddingVertical: 0,
    fontWeight: '500',
  },
  cancelButton: {
    marginLeft: 12,
  },
  cancelText: {
    color: '#1a3d2c',
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f6f6',
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
});