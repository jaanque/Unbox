import { FavoriteButton } from '@/components/FavoriteButton';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface Offer {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  stock?: number;
  end_time: string;
  image_url: string;
  local_id: string;
  locales?: {
    name: string;
    image_url: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
  };
  distance?: number;
}

interface OfferCardProps {
  offer: Offer;
  userLocation?: { latitude: number; longitude: number } | null;
  variant?: 'standard' | 'claim';
  style?: ViewStyle;
}

export function OfferCard({ offer, userLocation, variant = 'standard', style }: OfferCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

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

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  let distanceDisplay = null;
  if (userLocation && offer.locales?.latitude && offer.locales?.longitude) {
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      offer.locales.latitude,
      offer.locales.longitude
    );
    // Convert km to miles for "miles away" text if desired, or keep metric.
    // The image says "0.4 miles away". Let's approximate 1km = 0.62 miles.
    distanceDisplay = formatDistance(dist);
  }

  const handlePress = () => {
    router.push(`/offer/${offer.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.container, style]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: offer.image_url }} style={styles.image} />
        
        {/* Favorite Button - Top Right */}
        <View style={styles.favoriteContainer}>
            <FavoriteButton offerId={offer.id} size={20} color="#111" />
        </View>

        {/* Limited Badge - Bottom Left on Image */}
        {/* Only show LIMITED if stock is low or standard logic. Image shows "LIMITED". 
            Let's use stock < 5 for "LIMITED" or just show it if stock exists. */}
        {(offer.stock && offer.stock < 10) ? (
            <View style={styles.badgeContainer}>
                <ThemedText style={styles.badgeText}>LIMITED</ThemedText>
            </View>
        ) : null}

        {/* Claim Variant Button Overlay */}
        {variant === 'claim' && (
             <View style={styles.claimButtonOverlay}>
                 <View style={styles.claimButton}>
                     <ThemedText style={styles.claimButtonText}>CLAIM NOW</ThemedText>
                 </View>
             </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        {variant === 'standard' ? (
            // Standard Layout: Title/Subtitle Left, Price Right
            <View style={styles.standardRow}>
                <View style={styles.standardInfo}>
                    <ThemedText style={styles.title} numberOfLines={1}>{offer.locales?.name || offer.title}</ThemedText>
                    <ThemedText style={styles.subtitle} numberOfLines={1}>
                        {distanceDisplay}
                        {/* Add category if available, simplified for now */}
                        {offer.title ? ` • ${offer.title}` : ''}
                    </ThemedText>
                </View>
                <View style={styles.standardPrice}>
                    {offer.original_price && (
                        <ThemedText style={styles.originalPriceSmall}>{offer.original_price.toFixed(2)}€</ThemedText>
                    )}
                    <ThemedText style={styles.currentPriceLarge}>{offer.price.toFixed(2)}€</ThemedText>
                </View>
            </View>
        ) : (
            // Claim Layout: Title Top, Price Bottom Left
            <View style={styles.claimColumn}>
                 <ThemedText style={styles.title} numberOfLines={1}>{offer.locales?.name || offer.title}</ThemedText>
                 <View style={styles.claimPriceRow}>
                    <ThemedText style={styles.currentPriceLarge}>{offer.price.toFixed(2)}€</ThemedText>
                    {offer.original_price && (
                        <ThemedText style={styles.originalPriceStrikethrough}>{offer.original_price.toFixed(2)}€</ThemedText>
                    )}
                 </View>
            </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280, // Fixed width for horizontal scroll items
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 0,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20, // Circular
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#1a3d2c', // Dark Green
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  claimButtonOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  claimButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  claimButtonText: {
    color: '#1a3d2c',
    fontSize: 12,
    fontWeight: '800', // heavy bold
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  // Standard Styles
  standardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  standardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  standardPrice: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontWeight: '800', // Bold title
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  originalPriceSmall: {
    fontSize: 11,
    color: '#aaa', // Light grey
    textDecorationLine: 'line-through',
    marginBottom: 0,
  },
  currentPriceLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a3d2c', // Primary Green
  },
  // Claim Styles
  claimColumn: {
    gap: 4,
  },
  claimPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  originalPriceStrikethrough: {
    fontSize: 13,
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
});
