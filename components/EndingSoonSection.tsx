import { StyleSheet, Image, ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
          locales (name, image_url)
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

  const formatPickupTime = (endTime: string) => {
    const end = new Date(endTime);
    const hours = end.getHours().toString().padStart(2, '0');
    const minutes = end.getMinutes().toString().padStart(2, '0');
    // For demo, assume pickup is until end_time
    return `${hours}:${minutes}`;
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
                   <IconSymbol name="heart.fill" size={16} color="#fff" />
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.headerContentRow}>
                  <View style={styles.titleColumn}>
                     <ThemedText numberOfLines={1} style={styles.storeName}>
                      {offer.locales?.name}
                    </ThemedText>
                    <ThemedText numberOfLines={1} style={styles.itemName}>
                      {offer.title}
                    </ThemedText>
                  </View>
                   {offer.locales?.image_url && (
                    <Image source={{ uri: offer.locales.image_url }} style={styles.storeAvatar} />
                  )}
                </View>

                <View style={styles.pickupRow}>
                  <IconSymbol name="clock.fill" size={12} color="#4B5563" />
                  <ThemedText style={styles.pickupText}>
                    Hoy - {formatPickupTime(offer.end_time)}
                  </ThemedText>
                </View>

                <View style={styles.footerRow}>
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText>
                    {offer.original_price && (
                      <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                    )}
                  </View>

                   <View style={styles.ratingContainer}>
                      <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                      <ThemedText style={styles.ratingText}>4.8</ThemedText>
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
    width: 280,
    borderRadius: 8, // Square with slight rounding
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6', // Subtle border
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
  scarcityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC2626', // Stronger red
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scarcityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  storeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 6, // Square with slight rounding
    backgroundColor: '#F3F4F6',
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pickupText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
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
    color: '#059669', // Green for price often seen in food saver apps
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
});
