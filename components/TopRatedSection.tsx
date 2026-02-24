import { StyleSheet, Image, ScrollView, View, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
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
  locales?: {
    name: string;
    image_url: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
  };
}

interface TopRatedSectionProps {
  userLocation?: { latitude: number; longitude: number } | null;
  refreshTrigger?: number;
}

export function TopRatedSection({ userLocation, refreshTrigger = 0 }: TopRatedSectionProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  useEffect(() => {
    fetchTopRatedOffers();
  }, [refreshTrigger]);

  const fetchTopRatedOffers = async () => {
    try {
      const now = new Date();
      // Since Supabase JS client doesn't support easy ordering by foreign key column directly in one go without raw SQL or stored procedure for complex joins,
      // and we have a small dataset, we'll fetch active offers and sort client side by locale rating.
      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          *,
          stock,
          locales!inner (name, image_url, rating, latitude, longitude)
        `)
        .gt('end_time', now.toISOString());

      if (error) {
        console.error('Error fetching top rated offers:', error);
      } else if (data) {
        // Sort by rating descending
        const sorted = data.sort((a: any, b: any) => {
             const ratingA = a.locales?.rating || 0;
             const ratingB = b.locales?.rating || 0;
             return ratingB - ratingA;
        }).slice(0, 10);
        setOffers(sorted);
      }
    } catch (e) {
      console.error('Exception fetching top rated offers:', e);
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
        <View style={styles.headerRow}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Mejor valorados</ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Mejor valorados</ThemedText>
        <TouchableOpacity>
          <ThemedText style={styles.seeAllText}>Ver todo</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
              onPress={() => router.push(`/offer/${offer.id}`)}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    color: '#800020',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  card: {
    width: 300,
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
    height: 150,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 10,
  },
  headerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 1,
  },
  itemName: {
    fontSize: 12,
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
    paddingTop: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#800020',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
});
