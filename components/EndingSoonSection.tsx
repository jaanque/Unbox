import { Offer, OfferCard } from '@/components/OfferCard';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
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
      setLoading(true);
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
            <IconSymbol name="clock.fill" size={18} color="#333" />
            <ThemedText style={styles.sectionTitle}>Últimas unidades</ThemedText>
          </View>
        </View>
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
        <View style={styles.titleContainer}>
          <IconSymbol name="clock.fill" size={18} color="#333" />
          <ThemedText style={styles.sectionTitle}>Últimas unidades</ThemedText>
        </View>
        <TouchableOpacity 
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.endingSoonText}>ENDING SOON</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={280} // Ajusta según el ancho de tu OfferCard
        decelerationRate="fast"
      >
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            userLocation={userLocation}
            variant="claim" // Mantiene el estilo de "reclamar"
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
    alignItems: 'center',
    paddingHorizontal: 24, // Alineación premium
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900', // Tipografía potente
    color: '#11181C',
    letterSpacing: -0.8,
  },
  endingSoonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280', // Gris elegante para no saturar
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 24, // El scroll nace alineado con el título
    paddingBottom: 8,
    gap: 20, // Espacio generoso entre tarjetas
  },
});