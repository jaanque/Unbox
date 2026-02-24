import { StyleSheet, Image, ScrollView, View, ActivityIndicator } from 'react-native';
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
          locales (name)
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
        <IconSymbol name="chevron.right" size={16} color={Colors[theme].icon} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {offers.map((offer) => (
          <View key={offer.id} style={[styles.card, { backgroundColor: Colors[theme].background }]}>
            <Image source={{ uri: offer.image_url }} style={styles.cardImage} />

            <View style={styles.timerBadge}>
              <IconSymbol name="clock.fill" size={10} color="#fff" />
              <ThemedText style={styles.timerText}>{calculateTimeLeft(offer.end_time)}</ThemedText>
            </View>

            <View style={styles.cardContent}>
              <ThemedText numberOfLines={1} style={styles.cardTitle}>{offer.title}</ThemedText>
              <ThemedText numberOfLines={1} style={styles.storeName}>
                {offer.locales?.name}
              </ThemedText>

              <View style={styles.priceRow}>
                <ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText>
                {offer.original_price && (
                  <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                )}
              </View>
            </View>
          </View>
        ))}
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 260,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 8,
  },
  timerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  storeName: {
    fontSize: 12,
    color: '#687076',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
});
