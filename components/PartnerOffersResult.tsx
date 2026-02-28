import { CategoriesSection } from '@/components/CategoriesSection';
import { FavoriteButton } from '@/components/FavoriteButton';
import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Offer {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  stock?: number;
  end_time: string;
  image_url: string;
  local_id: string;
  category_id?: string;
  locales?: {
    name: string;
    image_url: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
  };
}

interface PartnerOffersResultProps {
  partnerId: string;
  partnerName?: string;
  categoryId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onBack: () => void;
  onSelectCategory?: (id: string) => void;
}

export function PartnerOffersResult({
  partnerId,
  partnerName,
  categoryId,
  userLocation,
  onBack,
  onSelectCategory
}: PartnerOffersResultProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartnerOffers();
  }, [partnerId, categoryId]);

  const fetchPartnerOffers = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let query = supabase
        .from('ofertas')
        .select(`
          *,
          locales (name, image_url, rating, latitude, longitude)
        `)
        .eq('local_id', partnerId)
        .gt('end_time', now.toISOString())
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOffers(data || []);
    } catch (e) {
      console.error('Error fetching partner offers:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCategorySelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onSelectCategory) {
      onSelectCategory(categoryId === id ? '' : id);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.circularBack}>
          <IconSymbol name="chevron.left" size={20} color="#11181C" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
                {partnerName || 'Establecimiento'}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>Todas las ofertas disponibles</ThemedText>
        </View>
      </View>

      {/* Filtro de Categorías */}
      {onSelectCategory && (
          <CategoriesSection
            selectedCategoryId={categoryId || null}
            onSelectCategory={handleCategorySelect}
          />
      )}

      {/* Listado de Ofertas */}
      <View style={styles.listContainer}>
        {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={{ marginBottom: 24 }}><SkeletonCard /></View>
            ))
        ) : offers.length === 0 ? (
            <View style={styles.emptyContainer}>
                <IconSymbol name="bag.fill" size={48} color="#D1D5DB" />
                <ThemedText style={styles.emptyText}>
                    No hay ofertas {categoryId ? 'en esta categoría' : 'por ahora'}.
                </ThemedText>
                <TouchableOpacity onPress={onBack} style={styles.emptyButton}>
                    <ThemedText style={styles.emptyButtonText}>Volver a explorar</ThemedText>
                </TouchableOpacity>
            </View>
        ) : (
            offers.map((offer) => {
                let distanceDisplay = null;
                if (userLocation && offer.locales?.latitude && offer.locales?.longitude) {
                    const dist = calculateDistance(userLocation.latitude, userLocation.longitude, offer.locales.latitude, offer.locales.longitude);
                    distanceDisplay = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
                }

                return (
                    <TouchableOpacity
                        key={offer.id}
                        activeOpacity={0.8}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/offer/${offer.id}`);
                        }}
                        style={styles.card}
                    >
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: offer.image_url }} style={styles.cardImage} />
                            
                            <View style={styles.stockBadge}>
                                <ThemedText style={styles.stockText}>
                                    {offer.stock && offer.stock > 0 ? `QUEDAN ${offer.stock}` : 'AGOTADO'}
                                </ThemedText>
                            </View>

                            <View style={styles.favWrapper}>
                                <FavoriteButton offerId={offer.id} size={18} />
                            </View>
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.mainInfo}>
                                <View style={styles.titleRow}>
                                    <ThemedText style={styles.offerTitle} numberOfLines={1}>{offer.title}</ThemedText>
                                    <View style={styles.ratingBox}>
                                        <IconSymbol name="star.fill" size={10} color="#111" />
                                        <ThemedText style={styles.ratingText}>
                                            {offer.locales?.rating ? Number(offer.locales.rating).toFixed(1) : '5.0'}
                                        </ThemedText>
                                    </View>
                                </View>
                                <ThemedText style={styles.distanceText}>
                                    {distanceDisplay ? `${distanceDisplay} de distancia` : 'Establecimiento Unbox'}
                                </ThemedText>
                            </View>

                            <View style={styles.priceRow}>
                                <View style={styles.priceGroup}>
                                    <ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText>
                                    {offer.original_price && (
                                        <ThemedText style={styles.oldPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                                    )}
                                </View>
                                {/* Flecha eliminada para un look más "clean" */}
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f6f6',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 16,
  },
  circularBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 32,
  },
  imageWrapper: {
    height: 200,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stockBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#11181C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  stockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  favWrapper: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  cardContent: {
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  mainInfo: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -0.6,
    flex: 1,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#11181C',
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: '#11181C',
  },
  oldPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#11181C',
  },
});