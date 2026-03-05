import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Animated, { Extrapolation, FadeInDown, LinearTransition, interpolate, interpolateColor, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomBackground: React.FC<any> = ({ style, animatedIndex }) => {
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderTopLeftRadius: interpolate(animatedIndex.value, [1.5, 2], [32, 0], Extrapolation.CLAMP),
    borderTopRightRadius: interpolate(animatedIndex.value, [1.5, 2], [32, 0], Extrapolation.CLAMP),
    shadowOpacity: interpolate(animatedIndex.value, [1.5, 2], [0.04, 0], Extrapolation.CLAMP),
  }));

  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowRadius: 16,
        elevation: 8,
      },
      containerAnimatedStyle,
    ],
    [style, containerAnimatedStyle]
  );
  return <Animated.View pointerEvents="none" style={containerStyle} />;
};

const CustomHandle: React.FC<any> = ({ style, animatedIndex }) => {
  const handleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [1.5, 2], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[style, handleAnimatedStyle, { alignItems: 'center' }]}>
      <View style={{
        backgroundColor: '#C7C7CC',
        width: 36,
        height: 5,
        borderRadius: 3,
        marginTop: 8,
      }} />
    </Animated.View>
  );
};

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
  const { height: windowHeight } = useWindowDimensions();
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

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const snapPoints = useMemo(() => ['50%', '75%', windowHeight - (insets.top + 64)], [windowHeight, insets.top]);
  const animatedIndex = useSharedValue(0);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedIndex.value,
      [1.5, 1.9],
      ['rgba(242, 242, 247, 0)', 'rgba(242, 242, 247, 1)']
    );
    const borderBottomWidth = interpolate(
      animatedIndex.value,
      [1.9, 2],
      [0, StyleSheet.hairlineWidth],
      Extrapolation.CLAMP
    );
    return {
      backgroundColor,
      borderBottomWidth,
      borderBottomColor: 'rgba(0,0,0,0.1)'
    };
  });

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
    <View style={styles.container}>
      {/* Background Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
        showsMyLocationButton={false}
        // Add map padding so the "center" of the map is pushed up,
        // preventing the bottom sheet (which covers ~50% of the screen) from hiding the user.
        mapPadding={{ top: insets.top + 64, right: 0, bottom: windowHeight * 0.52, left: 0 }}
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
      >
        {userLocation && (
          <Marker coordinate={userLocation} title="Tu ubicación" />
        )}
      </MapView>

      {/* Floating Header Area */}
      <Animated.View style={[styles.headerContainer, { paddingTop: insets.top }, headerAnimatedStyle]}>
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
      </Animated.View>

      {/* Content inside BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        animatedIndex={animatedIndex}
        backgroundComponent={CustomBackground}
        handleComponent={CustomHandle}
      >
        <BottomSheetScrollView
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
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Standard iOS grouped background
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    // Add a slight gradient or background if needed, here keeping it transparent
  },
  header: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: 16,
    // removed backgroundColor to be floating
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
    backgroundColor: '#fff', // Opaque white base so map doesn't peek through
    borderRadius: 9, // Native iOS squircle feel
    padding: 2,
    height: 32, // More compact
    // Float slightly to separate from Map
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  switcherBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
  },
  switcherBtnActive: {
    backgroundColor: '#E5E5EA', // Switcher active gray state inside white box instead of reverse
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switcherText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  switcherTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  chevron: {
    marginTop: 0,
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
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
    backgroundColor: '#fff', // Opaque white background
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36, // Native iOS search bar height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchBarIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17, // Standard iPhone content text
    color: '#000',
    fontWeight: '400',
  },
  cancelButton: {
    marginLeft: 14,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#007AFF', // iOS Native Blue
    fontWeight: '400',
    fontSize: 17,
  },
  bottomSheetBackground: {
    backgroundColor: '#F2F2F7', // Match outer background
    borderRadius: 32, // More pronounced, smooth top corners like Apple Maps
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 }, // Lift it visually a bit more lightly
    shadowOpacity: 0.04, // Very soft shadow
    shadowRadius: 16,
    elevation: 8,
  },
  bottomSheetHandle: {
    backgroundColor: '#C7C7CC', // iOS standard gray for the grabber handle
    width: 36,
    height: 5,
    borderRadius: 3,
    marginTop: 8, // Little breathing room at the top
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
});