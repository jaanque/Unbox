import { SkeletonOfferDetail } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const IMG_HEIGHT = 280; 
const layoutTransition = LinearTransition.duration(250);

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
        const formattedData = {
            ...data,
            locales: Array.isArray(data.locales) ? data.locales[0] : data.locales
        } as unknown as OfferDetail;
        
        setOffer(formattedData);
        
        skeletonOpacity.value = withTiming(0, { duration: 200 }, () => {
           runOnJS(setLoading)(false);
        });
      }
    } catch (e) {
      console.error('Exception fetching offer details:', e);
      setLoading(false);
    }
  };

  // 🔥 MAGIA DE LA ANIMACIÓN PARALLAX Y ZOOM 🔥
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scrollY = scrollOffset.value;
    
    // Si el usuario arrastra la pantalla hacia abajo desde el tope (Overscroll / Pull down)
    if (scrollY <= 0) {
      return {
        transform: [
          // Mantener la imagen pegada arriba compensando el desplazamiento
          { translateY: scrollY / 2 }, 
          // Hacer zoom basado en cuánto se tira hacia abajo
          { scale: 1 + Math.abs(scrollY) / IMG_HEIGHT } 
        ],
      };
    } 
    // Si el usuario hace scroll hacia abajo normalmente
    else {
      return {
        transform: [
          // Efecto Parallax: La imagen se mueve más lenta que el resto del contenido
          { translateY: scrollY * 0.4 }, 
          { scale: 1 }
        ],
      };
    }
  });

  const skeletonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: skeletonOpacity.value,
    };
  });

  if (!offer && !loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={{ color: '#6B7280', fontSize: 16 }}>Oferta no encontrada.</ThemedText>
      </ThemedView>
    );
  }

  const pickupEndTime = offer ? new Date(offer.end_time) : new Date();
  const pickupTimeFormatted = pickupEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f6f6' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={[styles.headerContainer, { top: Math.max(insets.top, 16), zIndex: 30 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.8}
        >
          <IconSymbol name="chevron.left" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      {loading && (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 20, backgroundColor: '#f8f6f6' }, skeletonAnimatedStyle]}>
            <SkeletonOfferDetail />
        </Animated.View>
      )}

      <View style={{ flex: 1 }}>
        <Animated.ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            bounces={true} // Permitir "rebote" para que el efecto de zoom funcione en iOS
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16} // Crítico para los 60fps en la animación
        >
            {offer && (
            <Animated.View entering={FadeIn.duration(400)}>
                
                {/* Contenedor de la Imagen con la animación aplicada */}
                <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
                    <Image source={{ uri: offer.image_url }} style={styles.heroImage} />
                    <View style={styles.imageOverlay} />
                </Animated.View>

                {/* Contenedor Principal (Z-Index alto para deslizarse por encima de la imagen) */}
                <View style={[styles.contentContainer, { backgroundColor: '#f8f6f6' }]}>
                    
                    <Animated.View layout={layoutTransition} style={styles.headerSection}>
                        <ThemedText type="title" style={styles.offerTitle}>{offer.title}</ThemedText>
                        
                        <View style={styles.partnerRow}>
                            {offer.locales?.image_url ? (
                                <Image source={{ uri: offer.locales.image_url }} style={styles.partnerAvatar} />
                            ) : (
                                <View style={[styles.partnerAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                                    <IconSymbol name="storefront" size={20} color="#9CA3AF" />
                                </View>
                            )}
                            <View style={styles.partnerInfoWrapper}>
                                <ThemedText type="subtitle" style={styles.partnerName}>{offer.locales?.name}</ThemedText>
                                <View style={styles.ratingRow}>
                                    <IconSymbol name="star.fill" size={14} color="#F59E0B" />
                                    <ThemedText style={styles.ratingText}>
                                        {offer.locales?.rating ? Number(offer.locales.rating).toFixed(1) : 'Nuevo'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View layout={layoutTransition} entering={FadeInDown.duration(200).delay(50)} style={styles.section}>
                        <ThemedText style={styles.sectionHeaderLabel}>PRECIO Y DISPONIBILIDAD</ThemedText>
                        <View style={styles.cardContainer}>
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
                                <View style={[styles.stockBadge, offer.stock === 0 && styles.stockBadgeEmpty]}>
                                    <ThemedText style={[styles.stockText, offer.stock === 0 && styles.stockTextEmpty]}>
                                        {offer.stock > 0 ? `${offer.stock} disponibles` : 'Agotado'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View layout={layoutTransition} entering={FadeInDown.duration(200).delay(100)} style={styles.section}>
                        <ThemedText style={styles.sectionHeaderLabel}>LO QUE OBTIENES</ThemedText>
                        <View style={styles.cardContainer}>
                            <ThemedText style={styles.descriptionText}>
                                {offer.description || 'Una deliciosa sorpresa de nuestro establecimiento. Los contenidos pueden variar según la disponibilidad diaria, pero siempre garantizamos calidad y frescura.'}
                            </ThemedText>
                        </View>
                    </Animated.View>

                    <Animated.View layout={layoutTransition} entering={FadeInDown.duration(200).delay(150)} style={styles.section}>
                        <ThemedText style={styles.sectionHeaderLabel}>HORARIO DE RECOGIDA</ThemedText>
                        <View style={styles.cardContainer}>
                            <View style={styles.infoRow}>
                                <View style={styles.iconBox}>
                                    <IconSymbol name="clock.fill" size={20} color="#333" />
                                </View>
                                <View>
                                    <ThemedText style={styles.infoTitle}>Hoy</ThemedText>
                                    <ThemedText style={styles.infoSubtitle}>Recoger antes de las {pickupTimeFormatted}</ThemedText>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View layout={layoutTransition} entering={FadeInDown.duration(200).delay(200)} style={styles.section}>
                        <ThemedText style={styles.sectionHeaderLabel}>UBICACIÓN</ThemedText>
                        <View style={styles.cardContainer}>
                            <TouchableOpacity
                                style={styles.mapPlaceholder}
                                activeOpacity={0.8}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                                <View style={styles.mapIconCircle}>
                                    <IconSymbol name="location.fill" size={24} color="#333" />
                                </View>
                                <ThemedText style={{ color: '#6B7280', marginTop: 8, fontWeight: '500', fontSize: 13 }}>Ver en mapa</ThemedText>
                            </TouchableOpacity>

                            {offer.locales?.address && (
                                <View style={styles.addressContainer}>
                                    <View style={styles.addressIconWrapper}>
                                        <IconSymbol name="mappin.fill" size={16} color="#9CA3AF" />
                                    </View>
                                    <ThemedText style={styles.addressText} numberOfLines={2}>
                                        {offer.locales.address}
                                    </ThemedText>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.directionsButton}
                                activeOpacity={0.8}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                                <IconSymbol name="safari.fill" size={16} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                </View>
            </Animated.View>
            )}
        </Animated.ScrollView>

        {offer && (
            <Animated.View layout={layoutTransition} style={styles.footer}>
                <SafeAreaView edges={['bottom']}>
                    <TouchableOpacity
                        style={[styles.primaryButton, offer.stock === 0 && { backgroundColor: '#9CA3AF' }]}
                        activeOpacity={0.8}
                        disabled={offer.stock === 0}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push(`/checkout/${offer.id}`);
                        }}
                    >
                        <View style={styles.buttonContent}>
                            <ThemedText style={styles.primaryButtonText}>
                                {offer.stock > 0 ? 'Reservar ahora' : 'Agotado'}
                            </ThemedText>
                            {offer.stock > 0 && (
                                <ThemedText style={styles.primaryButtonText}>{offer.price.toFixed(2)}€</ThemedText>
                            )}
                        </View>
                    </TouchableOpacity>
                </SafeAreaView>
            </Animated.View>
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
    backgroundColor: '#f8f6f6',
  },
  
  headerContainer: {
    position: 'absolute',
    left: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  scrollContent: {
    paddingBottom: 130,
  },
  
  // Modificaciones para permitir escalar desde el centro correctamente
  imageContainer: {
    height: IMG_HEIGHT,
    width: '100%',
    overflow: 'hidden', 
    backgroundColor: '#E5E7EB', // Color de fondo base por si la imagen tarda unos ms en renderizar
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  contentContainer: {
    marginTop: -24, 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16, 
    paddingTop: 24,
    paddingBottom: 20,
    zIndex: 1, // Asegura que se monte por encima de la imagen animada
  },
  headerSection: {
    marginBottom: 24, 
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 30,
    color: '#11181C',
    letterSpacing: -0.5,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  partnerInfoWrapper: {
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  section: {
    marginBottom: 20, 
  },
  sectionHeaderLabel: {
    fontSize: 12, 
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardContainer: {
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: '#E5E7EB', 
  },

  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
      fontSize: 13,
      color: '#6B7280',
      marginBottom: 2,
      fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 28, 
    fontWeight: '800',
    color: '#11181C', 
    lineHeight: 34,
  },
  originalPrice: {
    fontSize: 15,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '500',
    marginTop: 2,
  },
  
  stockBadge: {
      backgroundColor: '#E5E7EB',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 4, 
  },
  stockBadgeEmpty: {
      backgroundColor: '#FEE2E2',
  },
  stockText: {
      color: '#333', 
      fontSize: 12,
      fontWeight: '700',
  },
  stockTextEmpty: {
      color: '#991B1B',
  },

  descriptionText: {
    fontSize: 14, 
    color: '#4B5563',
    lineHeight: 22,
  },

  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#E5E7EB', 
      justifyContent: 'center',
      alignItems: 'center',
  },
  infoTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#11181C',
      marginBottom: 2,
  },
  infoSubtitle: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
  },

  mapPlaceholder: {
      width: '100%',
      height: 120, 
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
  },
  mapIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  addressContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 12,
      paddingHorizontal: 2,
  },
  addressIconWrapper: {
      marginTop: 2, 
  },
  addressText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: '#4B5563',
      lineHeight: 20,
  },
  directionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingVertical: 10,
      borderRadius: 10,
  },
  directionsButtonText: {
      color: '#4B5563',
      fontWeight: '600',
      fontSize: 14,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent', 
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16, 
  },
  primaryButton: {
    width: '100%',
    height: 56, 
    borderRadius: 14,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16, 
    fontWeight: '700',
  },
});