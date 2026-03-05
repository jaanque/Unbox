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

export function OfferCard({ offer, variant = 'standard', userLocation, style }: OfferCardProps) {

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/offer/${offer.id}`);
  };

  // --- LÓGICA DE DISTANCIA (Haversine) ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio de la tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  let distanceDisplay = '';
  if (userLocation && offer.locales?.latitude && offer.locales?.longitude) {
    const distKm = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      offer.locales.latitude,
      offer.locales.longitude
    );

    if (distKm < 1) {
      // Si es menos de 1km, mostrar en metros redondeados a decenas
      distanceDisplay = `${Math.round((distKm * 1000) / 10) * 10} m`;
    } else {
      // Mostrar en kilometros con 1 decimal
      distanceDisplay = `${distKm.toFixed(1)} km`;
    }
  }

  // --- COPY ESTRATÉGICO (Stock Sobrante) ---
  const categoryDisplay = "Pack sorpresa"; // En el futuro de offer.category_name
  const subtitleText = distanceDisplay
    ? `${distanceDisplay} • ${categoryDisplay}`
    : categoryDisplay;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.container, style]}
    >
      {/* CONTENEDOR DE IMAGEN */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: offer.image_url }} style={styles.image} />

        {/* Badge LIMITED (Texto para excedente) */}
        {(offer.stock && offer.stock < 5) && (
          <View style={styles.limitedBadge}>
            <ThemedText style={styles.limitedText}>ÚLTIMOS {offer.stock}</ThemedText>
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
            {subtitleText}
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
    borderRadius: 20, // Standard iOS large radius
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E5EA', // Standard iOS light grey placeholder
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
    backgroundColor: 'rgba(28, 28, 30, 0.75)',  // Translucent dark blur effect
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  limitedText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700', // Cleaner bold
    letterSpacing: 0.5,
  },
  favCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slight transparency
    width: 36, // Slightly smaller
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 8,
    elevation: 3,
  },
  claimOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.15)', // A bit darker to make pill pop
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimPill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  claimPillText: {
    fontSize: 13, // Readable
    fontWeight: '600',
    color: '#000', // true black
    letterSpacing: 0.5,
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
    fontSize: 17, // iOS Standard
    fontWeight: '600', // Semibold
    color: '#000', // True black
    flex: 1,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15, // iOS Standard secondary
    color: '#8E8E93', // iOS gray
    fontWeight: '400', // Regular
  },
  originalPrice: {
    fontSize: 15, // iOS Standard secondary
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  currentPrice: {
    fontSize: 17, // iOS Standard
    fontWeight: '700', // Make the discounted price pop a bit more
    color: '#007AFF', // Emphasize discount with Blue or keep black if preferred. Let's use blue for "opportunity".
    letterSpacing: -0.4,
  },
});