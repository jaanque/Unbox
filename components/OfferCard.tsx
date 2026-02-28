import { FavoriteButton } from '@/components/FavoriteButton';
import { ThemedText } from '@/components/themed-text';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface Offer {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  stock?: number;
  image_url: string;
  local_id: string;
  locales?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
}

interface OfferCardProps {
  offer: Offer;
  userLocation?: { latitude: number; longitude: number } | null;
  variant?: 'standard' | 'claim'; // Añadido para resolver los errores de TS
  style?: ViewStyle;
}

export function OfferCard({ offer, variant = 'standard', style }: OfferCardProps) {
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/offer/${offer.id}`);
  };

  // Datos de ejemplo para que luzca como tu imagen
  const distanceDisplay = "0.4 miles away"; 
  const categoryDisplay = "Pastries & Breads";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.container, style]}
    >
      {/* CONTENEDOR DE IMAGEN */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: offer.image_url }} style={styles.image} />
        
        {/* Badge LIMITED */}
        {(offer.stock && offer.stock < 10) && (
          <View style={styles.limitedBadge}>
            <ThemedText style={styles.limitedText}>LIMITED</ThemedText>
          </View>
        )}

        {/* Botón FAVORITO */}
        <View style={styles.favCircle}>
          <FavoriteButton offerId={offer.id} size={18} />
        </View>

        {/* SI LA VARIANTE ES CLAIM: Añadimos un botón flotante extra sobre la imagen */}
        {variant === 'claim' && (
            <View style={styles.claimOverlay}>
                <View style={styles.claimPill}>
                    <ThemedText style={styles.claimPillText}>RECLAMAR AHORA</ThemedText>
                </View>
            </View>
        )}
      </View>

      {/* CONTENIDO DE TEXTO */}
      <View style={styles.infoContainer}>
        
        <View style={styles.row}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {offer.locales?.name || offer.title}
          </ThemedText>
          {offer.original_price && (
            <ThemedText style={styles.originalPrice}>
              ${offer.original_price.toFixed(2)}
            </ThemedText>
          )}
        </View>

        <View style={[styles.row, { marginTop: 2 }]}>
          <ThemedText style={styles.subtitle}>
            {distanceDisplay} • {categoryDisplay}
          </ThemedText>
          <ThemedText style={styles.currentPrice}>
            ${offer.price.toFixed(2)}
          </ThemedText>
        </View>

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320, // Ajustado para que respire en el scroll horizontal
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: '100%',
    height: 180, 
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  limitedBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#1B3C2A', 
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  limitedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  favCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFF',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimPill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  claimPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 1,
  },
  infoContainer: {
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#11181C',
    flex: 1,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -0.5,
  },
});