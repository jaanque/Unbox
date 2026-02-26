import { StyleSheet, View, Image, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  interpolate,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SkeletonOfferDetail } from '@/components/Skeletons';

const IMG_HEIGHT = 300;

interface OfferDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  stock: number;
  end_time: string;
  image_url: string;
  local_id: string;
  locales?: {
    name: string;
    image_url: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams();
  const offerId = Array.isArray(id) ? id[0] : id;
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const insets = useSafeAreaInsets();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  // Shared value to fade out the skeleton
  const skeletonOpacity = useSharedValue(1);

  useEffect(() => {
    if (offerId) {
      fetchOfferDetails();
    }
  }, [offerId]);

  const fetchOfferDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          *,
          locales (name, image_url, rating, latitude, longitude, address)
        `)
        .eq('id', offerId)
        .single();

      if (error) {
        console.error('Error fetching offer details:', error);
        Alert.alert('Error', 'No se pudo cargar la oferta.');
        router.back();
      } else {
        setOffer(data);
        // Start fade-out animation once data is ready
        skeletonOpacity.value = withTiming(0, { duration: 150 }, () => {
           runOnJS(setLoading)(false);
        });
      }
    } catch (e) {
      console.error('Exception fetching offer details:', e);
      setLoading(false);
    }
  };

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-IMG_HEIGHT, 0, IMG_HEIGHT],
            [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-IMG_HEIGHT, 0, IMG_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  const skeletonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: skeletonOpacity.value,
    };
  });

  if (!offer && !loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Oferta no encontrada.</ThemedText>
      </ThemedView>
    );
  }

  const pickupEndTime = offer ? new Date(offer.end_time) : new Date();
  const pickupTimeFormatted = pickupEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Custom Header Back Button - Always Visible */}
      <View style={[styles.headerContainer, { top: insets.top, zIndex: 30 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.right" size={24} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Loading Skeleton Overlay - Absolute, Fades Out */}
      {loading && (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 20 }, skeletonAnimatedStyle]}>
            <SkeletonOfferDetail />
        </Animated.View>
      )}

      {/* Main Content - Always rendered to ensure scroll ref is initialized */}
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
        >
            {offer && (
            <>
                {/* Hero Image - Parallax */}
                <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
                <Image source={{ uri: offer.image_url }} style={styles.heroImage} />
                <View style={styles.imageOverlay} />
                </Animated.View>

                {/* Content Body */}
                <View style={[styles.contentContainer, { backgroundColor: Colors[theme].background }]}>

                {/* Header Info */}
                <View style={styles.headerSection}>
                    <ThemedText type="title" style={styles.offerTitle}>{offer.title}</ThemedText>

                    <View style={styles.partnerRow}>
                        {offer.locales?.image_url && (
                            <Image source={{ uri: offer.locales.image_url }} style={styles.partnerAvatar} />
                        )}
                        <View>
                            <ThemedText type="subtitle" style={styles.partnerName}>{offer.locales?.name}</ThemedText>
                            <View style={styles.ratingRow}>
                                <IconSymbol name="star.fill" size={14} color="#F59E0B" />
                                <ThemedText style={styles.ratingText}>
                                    {offer.locales?.rating ? Number(offer.locales.rating).toFixed(1) : 'New'}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Price & Stock */}
                <View style={styles.priceSection}>
                    <View>
                        <ThemedText style={styles.priceLabel}>Precio total</ThemedText>
                        <View style={styles.priceRow}>
                            <ThemedText style={styles.currentPrice}>{offer.price.toFixed(2)}€</ThemedText>
                            {offer.original_price && (
                                <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                            )}
                        </View>
                    </View>

                    <View style={styles.stockContainer}>
                        <ThemedText style={styles.stockText}>
                            {offer.stock > 0 ? `${offer.stock} packs disponibles` : 'Agotado'}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Description */}
                <View style={styles.section}>
                    <ThemedText type="subtitle" style={styles.sectionHeader}>Lo que obtienes</ThemedText>
                    <ThemedText style={styles.descriptionText}>
                        {offer.description || 'Una deliciosa sorpresa de nuestro establecimiento. Los contenidos pueden variar según la disponibilidad diaria, pero siempre garantizamos calidad y frescura.'}
                    </ThemedText>
                </View>

                <View style={styles.separator} />

                {/* Pickup Time */}
                <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionHeader}>Horario de recogida</ThemedText>
                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <IconSymbol name="clock.fill" size={20} color="#4B5563" />
                            </View>
                            <View>
                                <ThemedText style={styles.infoTitle}>Hoy</ThemedText>
                                <ThemedText style={styles.infoSubtitle}>Recoger antes de las {pickupTimeFormatted}</ThemedText>
                            </View>
                        </View>
                </View>

                <View style={styles.separator} />

                {/* Location */}
                <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionHeader}>Ubicación</ThemedText>
                        <TouchableOpacity
                            style={styles.mapPlaceholder}
                            activeOpacity={0.8}
                            onPress={() => {
                                if (offer.locales?.latitude && offer.locales?.longitude) {
                                    const lat = offer.locales.latitude;
                                    const lng = offer.locales.longitude;
                                    const label = encodeURIComponent(offer.locales.name || 'Ubicación');
                                    const url = Platform.select({
                                        ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
                                        android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                                    });
                                    if (url) Linking.openURL(url);
                                }
                            }}
                        >
                            <IconSymbol name="location.fill" size={32} color="#9CA3AF" />
                            <ThemedText style={{ color: '#9CA3AF', marginTop: 8 }}>Ver en mapa</ThemedText>
                        </TouchableOpacity>

                        {/* Address below map, no store name */}
                        {offer.locales?.address ? (
                            <ThemedText style={styles.addressText}>
                                {offer.locales.address}
                            </ThemedText>
                        ) : null}

                        <TouchableOpacity
                            style={styles.directionsButton}
                            onPress={() => {
                                if (offer.locales?.latitude && offer.locales?.longitude) {
                                    const lat = offer.locales.latitude;
                                    const lng = offer.locales.longitude;
                                    const url = Platform.select({
                                        ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
                                        android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                                    });
                                    if (url) Linking.openURL(url);
                                }
                            }}
                        >
                             <ThemedText style={styles.directionsButtonText}>Cómo llegar</ThemedText>
                        </TouchableOpacity>
                </View>

                </View>
            </>
            )}
        </Animated.ScrollView>

        {/* Footer Action */}
        {offer && (
            <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: Colors[theme].background }]}>
                <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/checkout/${offer.id}`)}
                >
                    <ThemedText style={styles.actionButtonText}>Reservar ahora - {offer.price.toFixed(2)}€</ThemedText>
                </TouchableOpacity>
            </SafeAreaView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: IMG_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  contentContainer: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 30,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 4,
      fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  currentPrice: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#5A228B', // Changed to maroon
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 6,
  },
  // Discount badge removed
  stockContainer: {
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
  },
  stockText: {
      color: '#4B5563',
      fontSize: 12,
      fontWeight: '600',
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11181C',
  },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
  },
  iconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
  },
  infoTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#11181C',
  },
  infoSubtitle: {
      fontSize: 14,
      color: '#6B7280',
  },
  mapPlaceholder: {
      width: '100%',
      height: 150,
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
  },
  addressText: {
      fontSize: 15,
      fontWeight: '500',
      color: '#11181C',
      marginBottom: 12,
  },
  directionsButton: {
      alignSelf: 'flex-start',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
  },
  directionsButtonText: {
      color: '#11181C',
      fontWeight: '600',
      fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8, // handled by safe area mostly
  },
  actionButton: {
    backgroundColor: '#5A228B', // Changed to maroon
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5A228B', // Changed to maroon
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
