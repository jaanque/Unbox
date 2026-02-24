import { StyleSheet, View, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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
    address?: string; // Assuming address might exist or we use name/city
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
          locales (name, image_url, rating, latitude, longitude)
        `)
        .eq('id', offerId)
        .single();

      if (error) {
        console.error('Error fetching offer details:', error);
        Alert.alert('Error', 'No se pudo cargar la oferta.');
        router.back();
      } else {
        setOffer(data);
      }
    } catch (e) {
      console.error('Exception fetching offer details:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  if (!offer) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Oferta no encontrada.</ThemedText>
      </ThemedView>
    );
  }

  const discountPercentage = offer.original_price
    ? Math.round(((offer.original_price - offer.price) / offer.original_price) * 100)
    : 0;

  const pickupEndTime = new Date(offer.end_time);
  const pickupTimeFormatted = pickupEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Custom Header Back Button */}
      <View style={[styles.headerContainer, { top: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.right" size={24} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: offer.image_url }} style={styles.heroImage} />
          <View style={styles.imageOverlay} />
        </View>

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
                            {offer.locales?.rating ? Number(offer.locales.rating).toFixed(1) : 'New'} (50+)
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
                         <>
                            <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                            <View style={styles.discountBadge}>
                                <ThemedText style={styles.discountText}>-{discountPercentage}%</ThemedText>
                            </View>
                         </>
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
                 <View style={styles.mapPlaceholder}>
                    {/* Placeholder for map - could use simple image or mapview */}
                    <IconSymbol name="location.fill" size={32} color="#9CA3AF" />
                    <ThemedText style={{ color: '#9CA3AF', marginTop: 8 }}>Mapa</ThemedText>
                 </View>
                 <ThemedText style={styles.addressText}>
                    {offer.locales?.name}
                 </ThemedText>
                  {offer.locales?.latitude && offer.locales?.longitude && (
                      <ThemedText style={styles.coordsText}>
                          {offer.locales.latitude.toFixed(4)}, {offer.locales.longitude.toFixed(4)}
                      </ThemedText>
                  )}
           </View>

        </View>
      </ScrollView>

      {/* Footer Action */}
      <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: Colors[theme].background }]}>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={() => Alert.alert('Reservado', '¡Has reservado este pack!')}>
            <ThemedText style={styles.actionButtonText}>Reservar ahora - {offer.price.toFixed(2)}€</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
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
    height: 300,
    width: '100%',
    position: 'relative',
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
    alignItems: 'flex-end',
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
    gap: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 6,
  },
  discountBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stockContainer: {
      backgroundColor: '#FEF2F2',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#FEE2E2',
  },
  stockText: {
      color: '#DC2626',
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
  },
  coordsText: {
      fontSize: 12,
      color: '#9CA3AF',
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
    backgroundColor: '#059669',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
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
