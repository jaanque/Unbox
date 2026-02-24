import { StyleSheet, Image, ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Type definitions
interface Offer {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  end_time: string;
  image_url: string;
  local_id: string;
  locales?: {
    name: string;
    image_url: string;
    rating?: number;
  };
}

export function EndingSoonSection() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  useEffect(() => {
    fetchEndingSoonOffers();
  }, []);

  const fetchEndingSoonOffers = async () => {
    try {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          *,
          locales (name, image_url, rating)
        `)
        .gt('end_time', now.toISOString())
        .lt('end_time', next24h.toISOString())
        .order('end_time', { ascending: true });

      if (error) {
        console.error('Error fetching offers:', error);
      } else if (data) {
        setOffers(data);
      }
    } catch (e) {
      console.error('Exception fetching offers:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors[theme].tint} />
      </View>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Terminan pronto</ThemedText>
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
          // Mock scarcity for visual
          const itemsLeft = (offer.id.charCodeAt(0) % 5) + 1;

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

                {/* Scarcity Badge */}
                <View style={styles.scarcityBadge}>
                  <ThemedText style={styles.scarcityText}>Quedan {itemsLeft}</ThemedText>
                </View>

                {/* Favorite Icon */}
                <View style={styles.favoriteBadge}>
                   <IconSymbol name="heart.fill" size={14} color="#fff" />
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
                    </ThemedText>
                  </View>
                   {offer.locales?.image_url && (
                    <Image source={{ uri: offer.locales.image_url }} style={styles.storeAvatar} />
                  )}
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
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
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  card: {
    width: 300, // Wider
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
    height: 150, // Slightly increased for "a bit bigger" feel
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scarcityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  scarcityText: {
    color: '#fff',
    fontSize: 10, // Reduced
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 28, // Reduced
    height: 28, // Reduced
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 10, // Reduced padding
  },
  headerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6, // Reduced margin
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  storeName: {
    fontSize: 14, // Reduced
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 1,
  },
  itemName: {
    fontSize: 12, // Reduced
    color: '#6B7280',
    fontWeight: '500',
  },
  storeAvatar: {
    width: 32, // Reduced
    height: 32, // Reduced
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6, // Reduced padding
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 16, // Reduced
    fontWeight: '800',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 12, // Reduced
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11, // Reduced
    fontWeight: '600',
    color: '#4B5563',
  },
});
