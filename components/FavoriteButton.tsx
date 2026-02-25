import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useFavorites } from '@/contexts/FavoritesContext';

interface FavoriteButtonProps {
  offerId: string;
  initialIsFavorite?: boolean; // Deprecated, but kept for compatibility
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ offerId, onToggle }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(offerId);
  const scale = useSharedValue(1);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const handlePress = async () => {
    // Check auth first
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    Haptics.selectionAsync();

    const newStatus = !isFav;

    // Animate
    scale.value = withSequence(
      withSpring(newStatus ? 1.2 : 0.8, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );

    // Toggle in context
    await toggleFavorite(offerId);

    if (onToggle) {
      onToggle(newStatus);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Animated.View style={animatedStyle}>
        <IconSymbol
          name={isFav ? 'heart.fill' : 'heart'}
          size={22}
          color={isFav ? '#5A228B' : Colors[theme].icon}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
});
