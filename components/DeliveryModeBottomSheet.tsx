import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type DeliveryMode = 'Recogida en tienda' | 'Ubicación actual';

interface DeliveryModeBottomSheetProps {
  selectedMode: DeliveryMode;
  onSelect: (mode: DeliveryMode) => void;
  onClose: () => void;
}

export const DeliveryModeBottomSheet = forwardRef<BottomSheet, DeliveryModeBottomSheetProps>(
  ({ selectedMode, onSelect, onClose }, ref) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const snapPoints = useMemo(() => ['45%'], []);

    const handleSelect = (mode: DeliveryMode) => {
      Haptics.selectionAsync();
      onSelect(mode);
      onClose();
    };

    // Enforce light theme colors regardless of system setting, as per global theme override.
    const borderColor = '#E5E7EB';
    const activeColor = Colors[theme].tint;
    const iconColor = Colors[theme].icon;
    const mutedColor = Colors[theme].icon;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        backgroundStyle={{ backgroundColor: Colors[theme].background }}
        handleIndicatorStyle={{ backgroundColor: Colors[theme].icon }}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Modo de entrega
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
              Elige cómo quieres recibir tu pedido
            </ThemedText>
            <ThemedText style={[styles.instruction, { color: mutedColor }]}>
              Selecciona una opción para continuar.
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.option,
              { borderColor },
              selectedMode === 'Recogida en tienda' && { borderColor: activeColor, backgroundColor: '#F9FAFB' }
            ]}
            onPress={() => handleSelect('Recogida en tienda')}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <IconSymbol
                name="bag.fill"
                size={24}
                color={selectedMode === 'Recogida en tienda' ? activeColor : iconColor}
              />
              <View style={styles.textContainer}>
                <ThemedText type="defaultSemiBold">Recogida en tienda</ThemedText>
                <ThemedText style={[styles.description, { color: mutedColor }]}>
                  Recoge tu pedido en la tienda más cercana.
                </ThemedText>
              </View>
            </View>
            {selectedMode === 'Recogida en tienda' && (
              <IconSymbol name="checkmark" size={20} color={activeColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              { borderColor },
              selectedMode === 'Ubicación actual' && { borderColor: activeColor, backgroundColor: '#F9FAFB' }
            ]}
            onPress={() => handleSelect('Ubicación actual')}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <IconSymbol
                name="location.fill"
                size={24}
                color={selectedMode === 'Ubicación actual' ? activeColor : iconColor}
              />
              <View style={styles.textContainer}>
                <ThemedText type="defaultSemiBold">Ubicación actual</ThemedText>
                <ThemedText style={[styles.description, { color: mutedColor }]}>
                  Recibe tu pedido donde estés.
                </ThemedText>
              </View>
            </View>
            {selectedMode === 'Ubicación actual' && (
              <IconSymbol name="checkmark" size={20} color={activeColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText type="defaultSemiBold" style={{ color: activeColor, fontWeight: 'bold', fontSize: 16 }}>
              Cerrar
            </ThemedText>
          </TouchableOpacity>

        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 4,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
    marginLeft: 12,
  },
  description: {
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 16,
  },
});
