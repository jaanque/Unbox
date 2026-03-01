import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 4, style }: SkeletonProps) {
  const opacity = useSharedValue(0.5);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.ease }),
        withTiming(0.5, { duration: 800, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const backgroundColor = theme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        {
          backgroundColor,
          width: width,
          height: height,
          borderRadius: borderRadius,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}
