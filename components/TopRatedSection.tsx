import { Offer, OfferCard } from '@/components/OfferCard';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
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
      setLoading(true);
      const now = new Date();
      
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
          <View style={styles.titleContainer}>
            <IconSymbol name="star.fill" size={18} color="#11181C" />
            <ThemedText style={styles.sectionTitle}>Mejor valorados</ThemedText>
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

  if (offers.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <IconSymbol name="star.fill" size={18} color="#11181C" />
          <ThemedText style={styles.sectionTitle}>Mejor valorados</ThemedText>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <ThemedText style={styles.seeAllText}>VER TODO</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // Snap effect para consistencia con las otras secciones
        snapToInterval={280} 
        decelerationRate="fast"
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
    marginVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -0.8,
  },
  seeAllText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 20,
  },
});