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
          <ThemedText style={styles.seeAllText}>VER TODO</ThemedText>
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
    alignItems: 'flex-end', // Alineación a la base para look moderno
    paddingHorizontal: 24, // Margen premium
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -0.8,
  },
  seeAllText: {
    fontSize: 11,
    color: '#6B7280', // Gris neutro premium
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 24, // Alineado con el título
    paddingBottom: 8,
    gap: 20, // Espacio generoso para que respire
  },
});