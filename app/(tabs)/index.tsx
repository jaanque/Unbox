import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AllPartnersSection } from '@/components/AllPartnersSection';
import { CategoriesSection } from '@/components/CategoriesSection';
import { CategoryOffersResult } from '@/components/CategoryOffersResult';
import { ClosestSection } from '@/components/ClosestSection';
import { EndingSoonSection } from '@/components/EndingSoonSection';
import { NewOffersSection } from '@/components/NewOffersSection';
import { PartnerOffersResult } from '@/components/PartnerOffersResult';
import { SearchResults } from '@/components/SearchResults';
import { ThemedText } from '@/components/themed-text';
import { TopRatedSection } from '@/components/TopRatedSection';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [deliveryAddressText, setDeliveryAddressText] = useState<string>('Ubicación actual');
  const [currentDeliveryMode, setCurrentDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');

  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; name: string } | null>(null);
  const [partnerCategoryId, setPartnerCategoryId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

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
    setCurrentDeliveryMode('delivery');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDeliveryAddressText('Ubicación desconocida');
        setIsLoading(false);
        return;
      }

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

        if (address.street && address.streetNumber) {
          streetInfo = `${address.street} ${address.streetNumber}`;
        } else if (address.name && /\d/.test(address.name)) {
          streetInfo = address.name;
        } else if (address.street) {
          streetInfo = address.street;
        } else if (address.name) {
          streetInfo = address.name;
        }

        if (streetInfo) parts.push(streetInfo);

        if (address.district && !parts.join(' ').includes(address.district)) {
          parts.push(address.district);
        }

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


  const handleSelectCategory = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(id);
      setSelectedPartner(null);
      setPartnerCategoryId(null);
      setSearchQuery('');
    }
  };

  const handleSelectPartner = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPartner({ id, name });
    setSelectedCategoryId(null);
    setPartnerCategoryId(null);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Area */}
      <View style={styles.header}>
        {!isSearchActive ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.headerInner}>
            <View style={styles.switcherContainer}>
              <TouchableOpacity
                style={[styles.switcherBtn, currentDeliveryMode === 'delivery' && styles.switcherBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentDeliveryMode('delivery');
                  handleUseCurrentLocation();
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.switcherText, currentDeliveryMode === 'delivery' && styles.switcherTextActive]}>Envío</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.switcherBtn, currentDeliveryMode === 'pickup' && styles.switcherBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentDeliveryMode('pickup');
                  setDeliveryAddressText('Recogida en tienda');
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.switcherText, currentDeliveryMode === 'pickup' && styles.switcherTextActive]}>Recogida</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.headerIconsRow}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSearchActive(true);
                }}
                activeOpacity={0.7}
                style={styles.headerIconButton}
              >
                <IconSymbol name="magnifyingglass" size={22} color="#333" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/profile');
                }}
                activeOpacity={0.7}
                style={styles.headerIconButton}
              >
                <IconSymbol name="person.crop.circle" size={22} color="#333" />
              </TouchableOpacity>
            </View>
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

      {/* Main Content */}
      <ScrollView
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
                <NewOffersSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                <ClosestSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                <EndingSoonSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                <TopRatedSection userLocation={userLocation} refreshTrigger={refreshTrigger} />
                <AllPartnersSection onSelect={handleSelectPartner} refreshTrigger={refreshTrigger} />
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    height: 80,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 3,
    borderBottomColor: '#1a1a1a', // Sketchy ink line
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  switcherContainer: {
    flex: 1,
    marginRight: 16,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    // Organic, wobbly feel
    borderTopLeftRadius: 14,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 16,
    padding: 3,
    height: 44,
    // Solid block shadow (Neubrutalism / Hand-drawn style)
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    transform: [{ rotate: '-0.5deg' }],
  },
  switcherBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  switcherBtnActive: {
    backgroundColor: '#E29E2E', // Amber from reference
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  switcherText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  switcherTextActive: {
    color: '#000',
    fontWeight: '900',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    backgroundColor: '#E29E2E', // Accent color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    // Irregular circle radii
    borderTopLeftRadius: 24,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 22,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    transform: [{ rotate: '1.5deg' }],
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
    borderWidth: 3,
    borderColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  searchBarIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  cancelButton: {
    marginLeft: 16,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#007AFF', // Keeping iOS Blue for action, or could use orange
    fontWeight: '900',
    fontSize: 17,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
});