import { Offer, OfferCard } from '@/components/OfferCard';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
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
        // Calculate distance and sort
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
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  if (!userLocation) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Cerca de ti</ThemedText>
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
        <ThemedText type="subtitle" style={styles.sectionTitle}>Cerca de ti</ThemedText>
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
