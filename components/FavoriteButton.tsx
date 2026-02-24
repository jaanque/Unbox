import { TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useCallback } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

interface FavoriteButtonProps {
  offerId: string;
  initialIsFavorite?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ offerId, initialIsFavorite = false, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const scale = useSharedValue(1);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const checkFavoriteStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setIsFavorite(false);
        return;
    }

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (data) {
        setIsFavorite(true);
    } else {
        setIsFavorite(false);
    }
  }, [offerId]);

  useFocusEffect(
    useCallback(() => {
      checkFavoriteStatus();
    }, [checkFavoriteStatus])
  );

  const handlePress = async () => {
    // Check auth first
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    Haptics.selectionAsync();

    const newStatus = !isFavorite;
    setIsFavorite(newStatus);

    scale.value = withSequence(
      withSpring(newStatus ? 1.2 : 0.8, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      if (newStatus) {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, offer_id: offerId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('offer_id', offerId);
        if (error) throw error;
      }

      if (onToggle) {
        onToggle(newStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsFavorite(!newStatus);
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
          name={isFavorite ? 'heart.fill' : 'heart'}
          size={22}
          color={isFavorite ? '#EF4444' : Colors[theme].icon}
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
