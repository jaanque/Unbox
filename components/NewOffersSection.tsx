import { Offer, OfferCard } from '@/components/OfferCard';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface NewOffersSectionProps {
  userLocation?: { latitude: number; longitude: number } | null;
  refreshTrigger?: number;
}

export function NewOffersSection({ userLocation, refreshTrigger = 0 }: NewOffersSectionProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewOffers();
  }, [refreshTrigger]);

  const fetchNewOffers = async () => {
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
        .gt('end_time', now.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching new offers:', error);
      } else if (data) {
        setOffers(data);
      }
    } catch (e) {
      console.error('Exception fetching new offers:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.sectionTitle}>Nuevas ofertas</ThemedText>
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
        <ThemedText style={styles.sectionTitle}>Nuevas ofertas</ThemedText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <ThemedText style={styles.seeAllText}>Ver todo</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // Snap effect para que las tarjetas se "claven" al deslizar
        snapToInterval={280} // Ajustar según el ancho de tu OfferCard + gap
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
    marginVertical: 20, // Aire constante entre secciones
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline', // Better alignment for text
    paddingHorizontal: 20, // iOS standard margin
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22, // iOS standard Title 2
    fontWeight: '700', // Bold, not Black
    color: '#000',
    letterSpacing: 0.35, // iOS default Title 2 tracking
  },
  seeAllText: {
    fontSize: 15,
    color: '#007AFF', // iOS standard Blue
    fontWeight: '400',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16,
  },
});