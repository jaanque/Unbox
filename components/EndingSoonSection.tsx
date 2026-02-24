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

  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
          const discount = offer.original_price
            ? Math.round(((offer.original_price - offer.price) / offer.original_price) * 100)
            : 0;

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
              <Image source={{ uri: offer.image_url }} style={styles.cardImage} />

              <View style={styles.timerBadge}>
                <IconSymbol name="clock.fill" size={12} color="#fff" />
                <ThemedText style={styles.timerText}>{calculateTimeLeft(offer.end_time)}</ThemedText>
              </View>

              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <ThemedText style={styles.discountText}>-{discount}%</ThemedText>
                </View>
              )}

              <View style={styles.cardContent}>
                <ThemedText numberOfLines={1} style={styles.cardTitle}>{offer.title}</ThemedText>

                <View style={styles.storeRow}>
                  {offer.locales?.image_url && (
                    <Image source={{ uri: offer.locales.image_url }} style={styles.storeAvatar} />
                  )}
                  <ThemedText numberOfLines={1} style={styles.storeName}>
                    {offer.locales?.name}
                  </ThemedText>
                </View>

                <View style={styles.priceRow}>
                  <ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText>
                  {offer.original_price && (
                    <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                  )}
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
    marginVertical: 20,
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
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF', // Standard iOS blue or theme tint
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8, // For shadow visibility
    gap: 16,
  },
  card: {
    width: 260,
    borderRadius: 6, // Updated to be square with slight rounding
    overflow: 'hidden',
    borderWidth: 0,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  timerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4, // Updated to be square with slight rounding
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4, // Updated to be square with slight rounding
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  storeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 4, // Updated to be square with slight rounding (was circle)
    backgroundColor: '#eee',
  },
  storeName: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
});
