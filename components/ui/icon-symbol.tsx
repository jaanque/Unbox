import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Mapeo de nombres de SF Symbols (iOS) a Material Icons (Android/Web)
const MAPPING = {
  // Navegación y Tabs
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'magnifyingglass': 'search',
  'bag.fill': 'shopping-bag',
  'person.crop.circle': 'account-circle',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'star.fill': 'star',
  
  // Direcciones y Mapas
  'location.fill': 'place',
  'mappin.fill': 'location-on',
  'safari.fill': 'explore',
  
  // UI y Controles
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'expand-more',
  'chevron.left.forwardslash.chevron.right': 'code',
  'xmark.circle.fill': 'cancel',
  'checkmark': 'check',
  'checkmark.circle.fill': 'check-circle', // <-- ¡Añadido para el BottomSheet y pedidos!
  
  // Acciones
  'plus': 'add',
  'minus': 'remove',
  'pencil': 'edit',
  'trash': 'delete',
  
  // Otros
  'clock.fill': 'access-time',
  'info.circle': 'info',
  'storefront': 'store',
  'bicycle': 'directions-bike',
  'carrot.fill': 'restaurant',
  'cart.fill': 'shopping-cart',
  'birthday.cake.fill': 'cake',
  'cup.and.saucer.fill': 'local-cafe',
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Componente de icono que utiliza SF Symbols nativos en iOS
 * y Material Icons en Android/Web para mantener coherencia.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons 
      color={color} 
      size={size} 
      name={MAPPING[name]} 
      style={style} 
    />
  );
}