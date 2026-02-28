import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Habilitamos haptics para iOS y Android (excluimos Web)
        if (Platform.OS !== 'web') {
          // Usamos ImpactFeedbackStyle.Light para un toque sutil y elegante
          // que simula el click de un botón físico de alta calidad.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        // Ejecutamos la acción original de la pestaña
        props.onPressIn?.(ev);
      }}
    />
  );
}