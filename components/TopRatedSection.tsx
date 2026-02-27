import { Offer, OfferCard } from '@/components/OfferCard';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface TopRatedSectionProps {
  userLocation?: { latitude: number; longitude: number } | null;
  refreshTrigger?: number;
}

export function TopRatedSection({ userLocation, refreshTrigger = 0 }: TopRatedSectionProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

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
          <ThemedText style={styles.seeAllText}>VER TODO</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {offers.map((offer) => (
            <OfferCard
                key={offer.id}
                offer={offer}
                userLocation={userLocation}
                variant="standard"
            />
        ))}
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
    fontWeight: '800', // Bold title
    color: '#111',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 12,
    color: '#1a3d2c', // Primary color
    fontWeight: '700',
    letterSpacing: 1, // Caps spacing
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
});
