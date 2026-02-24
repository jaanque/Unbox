import { StyleSheet, FlatList, View, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FavoriteButton } from '@/components/FavoriteButton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SkeletonListTile } from '@/components/Skeletons';

// Type definitions
interface FavoriteOffer {
  id: string; // This is the favorite id
  offer_id: string;
  ofertas: {
    id: string;
    title: string;
    price: number;
    original_price?: number;
    image_url: string;
    stock?: number;
    end_time: string;
    locales: {
      name: string;
      image_url: string;
      rating?: number;
    };
  };
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const fetchFavorites = async () => {
    // Only show full screen loader on initial load, not refresh
    if (!refreshing) setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        offer_id,
        ofertas (
          id,
          title,
          price,
          original_price,
          image_url,
          stock,
          end_time,
          locales (name, image_url, rating)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
    } else if (data) {
        // Filter out any favorites where the offer might have been deleted (null ofertas)
        const validFavorites = data.filter(item => item.ofertas !== null) as unknown as FavoriteOffer[];
        setFavorites(validFavorites);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const handleToggle = (isFavorite: boolean) => {
      // If un-favorited, refresh the list to remove it
      if (!isFavorite) {
          fetchFavorites();
      }
  };

  if (loading && favorites.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Favoritos</ThemedText>
        </View>
        <View style={styles.listContent}>
           {Array.from({ length: 6 }).map((_, index) => (
             <SkeletonListTile key={index} />
           ))}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Favoritos</ThemedText>
      </View>

      {favorites.length === 0 ? (
        <ScrollView
            contentContainerStyle={styles.emptyScrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors[theme].tint} />}
        >
          <View style={styles.emptyContainer}>
            <IconSymbol name="heart" size={60} color={Colors[theme].icon} />
            <ThemedText type="subtitle" style={styles.emptyText}>No tienes favoritos aún</ThemedText>
            <ThemedText style={styles.subEmptyText}>Dale ❤️ a las ofertas que te gusten para guardarlas aquí.</ThemedText>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: Colors[theme].background, borderColor: '#F3F4F6' }]}
              activeOpacity={0.9}
            >
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.ofertas.image_url }} style={styles.cardImage} />
                <View style={styles.stockBadge}>
                   {item.ofertas.stock && item.ofertas.stock > 0 ? (
                      <ThemedText style={styles.stockBadgeText}>Solo quedan {item.ofertas.stock}</ThemedText>
                   ) : (
                      <ThemedText style={styles.stockBadgeText}>Agotado</ThemedText>
                   )}
                </View>
              </View>

              <View style={styles.cardContent}>
                 <View style={styles.headerContentRow}>
                    <View style={styles.titleColumn}>
                        <ThemedText numberOfLines={1} style={styles.storeName}>
                            {item.ofertas.title}
                        </ThemedText>
                        <ThemedText numberOfLines={1} style={styles.itemName}>
                            {item.ofertas.locales?.name}
                        </ThemedText>
                    </View>
                    <View style={styles.favoriteButton}>
                        <FavoriteButton
                            offerId={item.ofertas.id}
                            initialIsFavorite={true}
                            onToggle={handleToggle}
                        />
                    </View>
                 </View>

                 <View style={styles.footerRow}>
                    <View style={styles.priceContainer}>
                        <ThemedText style={styles.price}>{item.ofertas.price.toFixed(2)}€</ThemedText>
                        {item.ofertas.original_price && (
                        <ThemedText style={styles.originalPrice}>{item.ofertas.original_price.toFixed(2)}€</ThemedText>
                        )}
                    </View>
                 </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  emptyScrollContainer: {
      flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  subEmptyText: {
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    height: 100,
  },
  imageContainer: {
    width: 100,
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stockBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stockBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#DC2626',
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  headerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  favoriteButton: {
    marginTop: -2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#800020',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
});
