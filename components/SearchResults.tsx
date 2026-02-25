import { StyleSheet, Image, View, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FavoriteButton } from '@/components/FavoriteButton';
import { SkeletonCard, SkeletonPartner } from '@/components/Skeletons';

interface Local {
  id: string;
  name: string;
  image_url: string;
  rating?: number;
}

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

interface SearchResultsProps {
  query: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectPartner: (id: string, name: string) => void;
}

export function SearchResults({ query, userLocation, onSelectPartner }: SearchResultsProps) {
  const [locales, setLocales] = useState<Local[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  useEffect(() => {
    if (query.trim().length === 0) {
      setLocales([]);
      setOffers([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = async (searchQuery: string) => {
    setLoading(true);
    try {
      const now = new Date();

      // Fetch Locales
      const { data: localesData, error: localesError } = await supabase
        .from('locales')
        .select('id, name, image_url, rating')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      if (localesError) {
        console.error('Error fetching locales:', localesError);
      } else {
        setLocales(localesData || []);
      }

      // Fetch Offers
      const { data: offersData, error: offersError } = await supabase
        .from('ofertas')
        .select(`
          *,
          locales (name, image_url, rating, latitude, longitude)
        `)
        .ilike('title', `%${searchQuery}%`)
        .gt('end_time', now.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (offersError) {
        console.error('Error fetching offers:', offersError);
      } else {
        setOffers(offersData || []);
      }

    } catch (e) {
      console.error('Exception fetching search results:', e);
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
        <View style={styles.section}>
             <ThemedText type="subtitle" style={styles.sectionTitle}>Buscando...</ThemedText>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                 <SkeletonPartner />
                 <SkeletonPartner />
             </ScrollView>
        </View>
        <View style={styles.section}>
            <SkeletonCard />
        </View>
      </View>
    );
  }

  if (locales.length === 0 && offers.length === 0) {
    return (
        <View style={styles.emptyContainer}>
            <IconSymbol name="magnifyingglass" size={48} color="#D1D5DB" />
            <ThemedText style={styles.emptyText}>No encontramos resultados para "{query}"</ThemedText>
            <ThemedText style={styles.subEmptyText}>Intenta con otro término o revisa la ortografía.</ThemedText>
        </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Locales Section */}
      {locales.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Locales</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {locales.map((local) => (
              <TouchableOpacity
                key={local.id}
                activeOpacity={0.8}
                style={styles.partnerCard}
                onPress={() => onSelectPartner(local.id, local.name)}
              >
                <View style={styles.partnerImageContainer}>
                    <Image source={{ uri: local.image_url }} style={styles.partnerImage} />
                </View>
                <ThemedText numberOfLines={1} style={styles.partnerName}>{local.name}</ThemedText>
                <View style={styles.partnerRatingContainer}>
                    <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                    <ThemedText style={styles.partnerRatingText}>
                        {local.rating ? local.rating.toFixed(1) : 'Nuevo'}
                    </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Offers Section */}
      {offers.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Ofertas</ThemedText>
          <View style={styles.offersList}>
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
                      styles.offerCard,
                      { backgroundColor: Colors[theme].background },
                      styles.shadow
                  ]}
                  >
                  <View style={styles.offerImageContainer}>
                      <Image source={{ uri: offer.image_url }} style={styles.offerImage} />
                      <View style={styles.stockBadge}>
                      {typeof offer.stock === 'number' && offer.stock > 0 ? (
                          <ThemedText style={styles.stockBadgeText}>Solo quedan {offer.stock}</ThemedText>
                      ) : (
                          <ThemedText style={styles.stockBadgeText}>Agotado</ThemedText>
                      )}
                      </View>
                  </View>

                  <View style={styles.offerContent}>
                      <View style={styles.headerContentRow}>
                      <View style={styles.titleColumn}>
                          <ThemedText numberOfLines={1} style={styles.offerTitle}>
                          {offer.title}
                          </ThemedText>
                          <ThemedText numberOfLines={1} style={styles.offerSubtitle}>
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    gap: 24,
    paddingTop: 16,
  },
  section: {
      gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  emptyContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
      gap: 12,
  },
  emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#11181C',
      textAlign: 'center',
  },
  subEmptyText: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
  },
  // Partner Card Styles
  partnerCard: {
    width: 100,
    alignItems: 'center',
    gap: 6,
  },
  partnerImageContainer: {
      width: 80,
      height: 80,
      borderRadius: 40, // Circle
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#F3F4F6',
  },
  partnerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
  },
  partnerName: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      color: '#11181C',
  },
  partnerRatingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
  },
  partnerRatingText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#92400E',
  },
  // Offer Card Styles
  offersList: {
      paddingHorizontal: 16,
      gap: 16,
  },
  offerCard: {
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
  offerImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  offerContent: {
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
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 2,
  },
  offerSubtitle: {
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
    color: '#5A228B',
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
