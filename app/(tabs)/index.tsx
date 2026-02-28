import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
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

      // PRECISIÓN AL LÍMITE DEL HARDWARE:
      // mayShowUserSettingsDialog forzará al GPS a encender su modo de alta precisión si está en ahorro de batería.
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true, 
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
        
        let streetInfo = '';
        
        // 1. Lógica ultra exhaustiva para sacar la calle + número exacto
        if (address.street && address.streetNumber) {
          streetInfo = `${address.street} ${address.streetNumber}`;
        } else if (address.name && /\d/.test(address.name)) {
          // A veces la API guarda la calle y el número juntos en "name" (ej. "Gran Vía 12")
          streetInfo = address.name;
        } else if (address.street) {
          streetInfo = address.street;
        } else if (address.name) {
          streetInfo = address.name;
        }

        if (streetInfo) parts.push(streetInfo);

        // 2. Reforzamos con el distrito (si no está ya incluido en la calle)
        if (address.district && !parts.join(' ').includes(address.district)) {
          parts.push(address.district);
        }

        // 3. Añadimos la ciudad
        if (address.city && address.city !== address.district) {
          parts.push(address.city);
        }

        setDeliveryAddressText(parts.length > 0 ? parts.join(', ') : 'Ubicación actual');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bottomSheetRef.current?.close();
    setCurrentDeliveryMode(selection.mode);
    if (selection.mode === 'Ubicación actual') {
      handleUseCurrentLocation();
    } else if (selection.mode === 'Recogida en tienda') {
      setDeliveryAddressText('Recogida en tienda');
    } else {
      setDeliveryAddressText(selection.address || 'Ubicación seleccionada');
      if (selection.location) setUserLocation(selection.location);
    }
  };

  const openBottomSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.expand();
  };

  const handleSelectCategory = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedPartner({ id, name });
      setSelectedCategoryId(null);
      setPartnerCategoryId(null);
      setSearchQuery('');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          {!isSearchActive ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.headerInner}>
              <TouchableOpacity
                onPress={openBottomSheet}
                style={styles.locationWrapper}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#333" style={styles.loadingIndicator} />
                ) : (
                  <View style={styles.locationContainer}>
                    <ThemedText numberOfLines={1} style={styles.locationText}>
                      {deliveryAddressText}
                    </ThemedText>
                    <IconSymbol name="chevron.down" size={14} color="#333" style={styles.chevron} />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSearchActive(true);
                }} 
                activeOpacity={0.7}
                style={styles.searchIconButton}
              >
                <IconSymbol name="magnifyingglass" size={22} color="#333" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.activeSearchContainer}>
              <View style={styles.searchBar}>
                <IconSymbol name="magnifyingglass" size={18} color="#9CA3AF" style={styles.searchBarIcon} />
                <TextInput
                  placeholder="¿Qué buscas hoy?"
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSearchActive(false);
                  setSearchQuery('');
                }} 
                style={styles.cancelButton}
              >
                <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* --- CONTENT --- */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#333" />
          }
        >
          {searchQuery.length > 0 ? (
             <SearchResults query={searchQuery} userLocation={userLocation} onSelectPartner={handleSelectPartner} />
          ) : (
            <Animated.View layout={LinearTransition}>
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
                        onBack={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedPartner(null);
                          setPartnerCategoryId(null);
                        }}
                        onSelectCategory={(id) => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPartnerCategoryId(partnerCategoryId === id ? null : id);
                        }}
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
            </Animated.View>
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
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: 16, // Esto pone el marco base
    backgroundColor: '#f8f6f6',
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  locationWrapper: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },
  loadingIndicator: {
    alignSelf: 'flex-start',
    marginLeft: 12, // Alineado con el nuevo margen
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12, // AUMENTADO: Empuja el texto más a la derecha para equilibrar visualmente
  },
  locationText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#333',
    flexShrink: 1,
    letterSpacing: -0.4,
  },
  chevron: {
    marginTop: 2,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  activeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#11181C',
    fontWeight: '600',
  },
  cancelButton: {
    marginLeft: 14,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
});