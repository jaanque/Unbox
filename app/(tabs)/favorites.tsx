import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorites } from '@/contexts/FavoritesContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated';

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavorites(); 
  const [favoriteOffers, setFavoriteOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carga de datos basada en los IDs del contexto
  useEffect(() => {
    fetchFavoriteDetails();
  }, [favorites]);

  const fetchFavoriteDetails = async () => {
    if (!favorites || favorites.size === 0) {
      setFavoriteOffers([]);
      setLoading(false);
      return;
    }

    try {
      const idsArray = Array.from(favorites);
      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          id,
          title,
          price,
          image_url,
          locales (id, name, rating)
        `)
        .in('id', idsArray);

      if (error) throw error;
      setFavoriteOffers(data || []);
    } catch (e) {
      console.error('Error fetching favorites details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(id);
  };

  const renderFavoriteItem = ({ item, index }: { item: any, index: number }) => {
    const locale = Array.isArray(item.locales) ? item.locales[0] : item.locales;

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 30).duration(400)}
        exiting={FadeOut.duration(300)}
        layout={LinearTransition.duration(250)}
      >
        <TouchableOpacity 
          style={styles.favoriteCard}
          activeOpacity={0.8}
          onPress={() => router.push(`/offer/${item.id}`)}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.offerImage} />
          ) : (
            <View style={[styles.offerImage, styles.placeholderImage]}>
              <IconSymbol name="bag.fill" size={28} color="#9CA3AF" />
            </View>
          )}
          
          <View style={styles.infoContent}>
            <View>
              <View style={styles.headerRow}>
                <ThemedText style={styles.offerTitle} numberOfLines={1}>{item.title}</ThemedText>
                <TouchableOpacity 
                  onPress={() => handleToggleFavorite(item.id)}
                  style={styles.heartButton}
                >
                  <IconSymbol name="heart.fill" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.partnerName} numberOfLines={1}>{locale?.name || 'Establecimiento'}</ThemedText>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.ratingBox}>
                <IconSymbol name="star.fill" size={10} color="#F59E0B" />
                <ThemedText style={styles.ratingText}>
                  {locale?.rating ? Number(locale.rating).toFixed(1) : 'Nuevo'}
                </ThemedText>
              </View>
              <ThemedText style={styles.priceText}>{item.price.toFixed(2)}€</ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && favoriteOffers.length === 0 && (favorites?.size || 0) > 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#333" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Favoritos',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#f8f6f6' },
        headerTitleStyle: { fontWeight: '800', color: '#11181C', fontSize: 18 }
      }} />

      <Animated.FlatList
        data={favoriteOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderFavoriteItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={LinearTransition}
        ListHeaderComponent={favoriteOffers.length > 0 ? (
          <ThemedText style={styles.sectionHeaderLabel}>Tus ofertas guardadas</ThemedText>
        ) : null}
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <IconSymbol name="heart" size={40} color="#9CA3AF" />
              </View>
              <ThemedText style={styles.emptyTitle}>Sin favoritos</ThemedText>
              <ThemedText style={styles.emptySubtitle}>Toca el corazón en una oferta para guardarla.</ThemedText>
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)')}>
                <ThemedText style={styles.exploreButtonText}>Explorar</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6f6' },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, flexGrow: 1 },
  
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  offerImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f3f4f6' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  
  infoContent: { 
    flex: 1, 
    marginLeft: 12, 
    height: 80, 
    justifyContent: 'space-between',
  },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  offerTitle: { fontSize: 16, fontWeight: '800', color: '#11181C', flex: 1, marginRight: 4 },
  heartButton: { padding: 2, marginTop: -2 },
  
  partnerName: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#f8f6f6', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#333' },
  priceText: { fontSize: 18, fontWeight: '900', color: '#333' },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#11181C', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  exploreButton: { backgroundColor: '#333', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});