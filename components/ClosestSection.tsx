import { Offer, OfferCard } from '@/components/OfferCard';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ClosestSectionProps {
  userLocation?: { latitude: number; longitude: number } | null;
  refreshTrigger?: number;
}

export function ClosestSection({ userLocation, refreshTrigger = 0 }: ClosestSectionProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLocation) {
      fetchClosestOffers();
    } else {
      setLoading(false);
    }
  }, [userLocation, refreshTrigger]);

  const fetchClosestOffers = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          *,
          stock,
          locales (name, image_url, rating, latitude, longitude)
        `)
        .gt('end_time', now.toISOString());

      if (error) {
        console.error('Error fetching closest offers:', error);
      } else if (data) {
        const offersWithDistance = data.map((offer: any) => {
          const dist = calculateDistance(
            userLocation!.latitude,
            userLocation!.longitude,
            offer.locales?.latitude || 0,
            offer.locales?.longitude || 0
          );
          return { ...offer, distance: dist };
        });

        const sorted = offersWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 10);
        setOffers(sorted);
      }
    } catch (e) {
      console.error('Exception fetching closest offers:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!userLocation) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.sectionTitle}>Cerca de ti</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
        <ThemedText style={styles.sectionTitle}>Cerca de ti</ThemedText>
        <TouchableOpacity
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.seeAllText}>Ver todo</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={280} // Ajustar al ancho de tu OfferCard + gap
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
    marginVertical: 20, // Más aire entre secciones
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.35,
  },
  seeAllText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '400',
    paddingBottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16,
  },
});