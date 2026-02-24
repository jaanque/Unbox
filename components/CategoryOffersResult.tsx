import { StyleSheet, Image, View, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FavoriteButton } from '@/components/FavoriteButton';
import { SkeletonCard } from '@/components/Skeletons';

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
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  useEffect(() => {
    fetchCategoryOffers();
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

      if (error) {
        console.error('Error fetching category offers:', error);
      } else if (data) {
        setOffers(data);
      }
    } catch (e) {
      console.error('Exception fetching category offers:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={{ marginBottom: 16 }}>
                 <SkeletonCard />
            </View>
        ))}
      </View>
    );
  }

  if (offers.length === 0) {
    return (
        <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No hay ofertas en esta categoría por ahora.</ThemedText>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      {offers.map((offer) => {
           let distanceDisplay = null;
           if (userLocation && offer.locales?.latitude && offer.locales?.longitude) {
             const dist = calculateDistance(
               userLocation.latitude,
               userLocation.longitude,
               offer.locales.latitude,
               offer.locales.longitude
             );
             distanceDisplay = formatDistance(dist);
           }

          return (
            <TouchableOpacity
              key={offer.id}
              activeOpacity={0.9}
              style={[
                styles.card,
                { backgroundColor: Colors[theme].background },
                styles.shadow
              ]}
            >
              <View style={styles.imageContainer}>
                <Image source={{ uri: offer.image_url }} style={styles.cardImage} />
                 <View style={styles.stockBadge}>
                   {typeof offer.stock === 'number' && offer.stock > 0 ? (
                      <ThemedText style={styles.stockBadgeText}>Solo quedan {offer.stock}</ThemedText>
                   ) : (
                      <ThemedText style={styles.stockBadgeText}>Agotado</ThemedText>
                   )}
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.headerContentRow}>
                  <View style={styles.titleColumn}>
                     <ThemedText numberOfLines={1} style={styles.storeName}>
                      {offer.title}
                    </ThemedText>
                    <ThemedText numberOfLines={1} style={styles.itemName}>
                      {offer.locales?.name}
                      {distanceDisplay && ` • ${distanceDisplay}`}
                    </ThemedText>
                  </View>
                   <View style={styles.favoriteButton}>
                    <FavoriteButton offerId={offer.id} />
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText>
                    {offer.original_price && (
                      <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                    )}
                  </View>

                   <View style={styles.ratingContainer}>
                      <IconSymbol name="star.fill" size={11} color="#F59E0B" />
                      <ThemedText style={styles.ratingText}>
                        {offer.locales?.rating ? Number(offer.locales.rating).toFixed(1) : 'New'}
                      </ThemedText>
                   </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
  },
  emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  headerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
   favoriteButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  stockBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
