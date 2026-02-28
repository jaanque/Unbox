import { SkeletonPartner } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Local {
  id: string;
  name: string;
  image_url: string;
  rating?: number;
}

interface Offer {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  stock?: number;
  image_url: string;
  locales?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
}

interface SearchResultsProps {
  query: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectPartner: (id: string, name: string) => void;
}

// ⬇️ ESTA LÍNEA ES LA CLAVE: Export nombrado
export function SearchResults({ query, userLocation, onSelectPartner }: SearchResultsProps) {
  const [locales, setLocales] = useState<Local[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setLocales([]);
      setOffers([]);
      return;
    }
    const timer = setTimeout(() => fetchResults(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = async (searchQuery: string) => {
    setLoading(true);
    try {
      const now = new Date();
      const { data: loc } = await supabase.from('locales').select('id, name, image_url, rating').ilike('name', `%${searchQuery}%`).limit(5);
      const { data: off } = await supabase.from('ofertas').select(`*, locales (name, latitude, longitude)`).ilike('title', `%${searchQuery}%`).gt('end_time', now.toISOString()).limit(10);
      setLocales(loc || []);
      setOffers(off || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.section}><ThemedText style={styles.sectionTitle}>Buscando...</ThemedText><SkeletonPartner /></View>
    </View>
  );

  if (locales.length === 0 && offers.length === 0) return (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>Sin resultados para "{query}"</ThemedText>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {locales.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Establecimientos</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 24, gap: 15}}>
            {locales.map(local => (
              <TouchableOpacity key={local.id} style={styles.partnerCard} onPress={() => onSelectPartner(local.id, local.name)}>
                <View style={styles.partnerImageContainer}><Image source={{ uri: local.image_url }} style={styles.partnerImage} /></View>
                <ThemedText numberOfLines={1} style={styles.partnerName}>{local.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {offers.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ofertas</ThemedText>
          <View style={{paddingHorizontal: 24, gap: 25}}>
            {offers.map(offer => (
              <TouchableOpacity key={offer.id} style={styles.offerCard} onPress={() => router.push(`/offer/${offer.id}`)}>
                <View style={styles.imageWrapper}><Image source={{ uri: offer.image_url }} style={styles.image} /></View>
                <View style={styles.infoRow}><ThemedText style={styles.title}>{offer.locales?.name}</ThemedText><ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText></View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  section: { paddingVertical: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '900', paddingHorizontal: 24, marginBottom: 15 },
  partnerCard: { width: 85, alignItems: 'center' },
  partnerImageContainer: { width: 75, height: 75, borderRadius: 28, overflow: 'hidden', backgroundColor: '#eee' },
  partnerImage: { width: '100%', height: '100%' },
  partnerName: { fontSize: 12, fontWeight: '800', marginTop: 8 },
  offerCard: { width: '100%' },
  imageWrapper: { height: 200, borderRadius: 28, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  title: { fontSize: 18, fontWeight: '900' },
  price: { fontSize: 20, fontWeight: '900' },
  emptyContainer: { padding: 50, alignItems: 'center' },
  emptyText: { fontWeight: '700', color: '#999' }
});