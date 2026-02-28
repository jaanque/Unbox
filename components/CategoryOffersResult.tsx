import { FavoriteButton } from '@/components/FavoriteButton';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Offer {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  stock?: number;
  end_time: string;
  image_url: string;
  local_id: string;
  category_id?: string;
  locales?: {
    name: string;
    image_url: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
  };
}

interface CategoryOffersResultProps {
  categoryId: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

export function CategoryOffersResult({ categoryId, userLocation }: CategoryOffersResultProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) fetchCategoryOffers();
  }, [categoryId]);

  const fetchCategoryOffers = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          *,
          locales (name, image_url, rating, latitude, longitude)
        `)
        .eq('category_id', categoryId)
        .gt('end_time', now.toISOString())
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching:', error);
      else if (data) setOffers(data);
    } catch (e) {
      console.error('Exception:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 3 }).map((_, i) => <View key={i} style={{marginBottom: 24}}><SkeletonCard /></View>)}
      </View>
    );
  }

  if (offers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="bag.fill" size={40} color="#E5E7EB" />
        <ThemedText style={styles.emptyText}>No hay ofertas disponibles aquí.</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {offers.map((offer) => {
        let distanceDisplay = null;
        if (userLocation && offer.locales?.latitude && offer.locales?.longitude) {
          const dist = calculateDistance(userLocation.latitude, userLocation.longitude, offer.locales.latitude, offer.locales.longitude);
          distanceDisplay = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
        }

        return (
          <TouchableOpacity
            key={offer.id}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/offer/${offer.id}`);
            }}
            style={styles.card}
          >
            {/* IMAGEN CHUNKY */}
            <View style={styles.imageWrapper}>
              <Image source={{ uri: offer.image_url }} style={styles.cardImage} />
              
              {/* Badge de Stock flotante y redondeado */}
              {offer.stock !== undefined && (
                <View style={styles.stockBadge}>
                  <ThemedText style={styles.stockBadgeText}>
                    {offer.stock > 0 ? `Quedan ${offer.stock}` : 'Agotado'}
                  </ThemedText>
                </View>
              )}

              {/* Botón de favoritos flotante sobre la imagen */}
              <View style={styles.favWrapper}>
                <FavoriteButton offerId={offer.id} />
              </View>
            </View>

            {/* CONTENIDO SIN BORDES */}
            <View style={styles.cardContent}>
              <View style={styles.mainInfo}>
                <View style={styles.titleRow}>
                  <ThemedText style={styles.offerTitle} numberOfLines={1}>{offer.title}</ThemedText>
                  <View style={styles.ratingBox}>
                    <IconSymbol name="star.fill" size={10} color="#333" />
                    <ThemedText style={styles.ratingText}>
                      {offer.locales?.rating ? Number(offer.locales.rating).toFixed(1) : 'Nuevo'}
                    </ThemedText>
                  </View>
                </View>
                
                <ThemedText style={styles.partnerInfo} numberOfLines={1}>
                  {offer.locales?.name} {distanceDisplay && ` • ${distanceDisplay}`}
                </ThemedText>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.priceContainer}>
                  <ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText>
                  {offer.original_price && (
                    <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                  )}
                </View>
                <IconSymbol name="chevron.right" size={12} color="#D1D5DB" />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24, // Margen lateral amplio para respiro total
    paddingTop: 10,
    paddingBottom: 60,
  },
  card: {
    width: '100%',
    marginBottom: 36, // Mucho espacio entre ofertas
  },
  imageWrapper: {
    height: 200,
    width: '100%',
    borderRadius: 24, // Redondeado Chunky
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favWrapper: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 2,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  cardContent: {
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  mainInfo: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -0.6,
    flex: 1,
  },
  partnerInfo: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#11181C',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#11181C',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
  },
});