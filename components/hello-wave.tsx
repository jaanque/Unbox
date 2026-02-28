import { ThemedText } from '@/components/themed-text';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Iniciamos la animación al montar el componente
    // Crea un movimiento de vaivén (0 -> 25 -> -10 -> 0) repetido 4 veces
    rotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 150 }),
        withTiming(-10, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ),
      4 // Se repite 4 veces
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      // Pequeño truco premium: Escalamos un pelín al saludar
      { scale: withSpring(rotation.value !== 0 ? 1.1 : 1) }
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Alineamos el origen de la rotación a la parte inferior derecha 
    // para que parezca un saludo real desde el brazo.
    transformOrigin: 'bottom right', 
  },
  text: {
    fontSize: 32, // Un poco más "chunky"
    lineHeight: 36,
    marginTop: -6,
  },
});