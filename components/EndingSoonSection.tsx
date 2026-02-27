import { Offer, OfferCard } from '@/components/OfferCard';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface EndingSoonSectionProps {
  userLocation?: { latitude: number; longitude: number } | null;
  refreshTrigger?: number;
}

export function EndingSoonSection({ userLocation, refreshTrigger = 0 }: EndingSoonSectionProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEndingSoonOffers();
  }, [refreshTrigger]);

  const fetchEndingSoonOffers = async () => {
    try {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          *,
          stock,
          locales (name, image_url, rating, latitude, longitude)
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
      <View style={styles.container}>
        <View style={styles.headerRow}>
           <View style={styles.titleContainer}>
                <IconSymbol name="clock.fill" size={20} color="#1a3d2c" />
                <ThemedText type="subtitle" style={styles.sectionTitle}>Últimas unidades</ThemedText>
           </View>
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
        <View style={styles.titleContainer}>
            <IconSymbol name="clock.fill" size={20} color="#1a3d2c" />
            <ThemedText type="subtitle" style={styles.sectionTitle}>Últimas unidades</ThemedText>
        </View>
        <TouchableOpacity>
           {/* Image shows "ENDING SOON" text on the right side of header, maybe. Or just "Last Units". 
               I'll add "ENDING SOON" text to match image style if apparent.
               Actually image title is "Last Units" and on the right "ENDING SOON" with a clock icon.
           */}
          <ThemedText style={styles.endingSoonText}>ENDING SOON</ThemedText>
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
                variant="claim"
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
  titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800', // Bold title
    color: '#111',
    letterSpacing: -0.5,
  },
  endingSoonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#1a3d2c',
      letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
});
