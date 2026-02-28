import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring
} from 'react-native-reanimated';

interface FavoriteButtonProps {
  offerId: string;
  onToggle?: (isFavorite: boolean) => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function FavoriteButton({ offerId, onToggle, size = 20, color, style }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(offerId);
  const scale = useSharedValue(1);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  // Color Premium: Rojo vibrante si es favorito, gris oscuro/claro si no.
  const activeColor = '#FF3B30'; // Rojo iOS System para favoritos
  const inactiveColor = color || (theme === 'light' ? '#11181C' : '#FFFFFF');
  const iconColor = isFav ? activeColor : inactiveColor;

  const handlePress = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/login');
      return;
    }

    // Feedback táctil ligero y premium
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newStatus = !isFav;

    // Animación de "latido" (Pop)
    scale.value = withSequence(
      withSpring(1.3, { damping: 12, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );

    await toggleFavorite(offerId);

    if (onToggle) {
      onToggle(newStatus);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withSpring(isFav ? 1 : 0.6), // Sutil transparencia si no es favorito
  }));

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.7}
      style={[styles.container, style]}
    >
      <Animated.View style={animatedStyle}>
        <IconSymbol
          name={isFav ? 'heart.fill' : 'heart'}
          size={size}
          color={iconColor}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    // Sin bordes y sin fondo pesado por defecto
    // Se apoya en el componente padre si necesita fondo (ej: sobre imagen)
  },
});