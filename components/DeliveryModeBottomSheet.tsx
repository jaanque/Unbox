import React, { forwardRef, useMemo, useState, useEffect } from 'react';
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
    const [tempSelectedMode, setTempSelectedMode] = useState<DeliveryMode>(selectedMode);

    useEffect(() => {
      setTempSelectedMode(selectedMode);
    }, [selectedMode]);

    const handleSelect = (mode: DeliveryMode) => {
      Haptics.selectionAsync();
      setTempSelectedMode(mode);
    };

    const activeColor = Colors[theme].primary;
    const lightPrimary = Colors[theme].lightPrimary;
    const greyBackground = Colors[theme].greyBackground;
    const iconColor = Colors[theme].icon;

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
            <ThemedText style={[styles.subtitle, { color: iconColor }]}>
              Elige cómo quieres recibir tu pedido
            </ThemedText>
            <ThemedText style={[styles.instruction, { color: iconColor }]}>
              Selecciona una opción para continuar.
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.option,
              tempSelectedMode === 'Recogida en tienda'
                ? { backgroundColor: lightPrimary, borderColor: activeColor }
                : { backgroundColor: greyBackground, borderColor: 'transparent' }
            ]}
            onPress={() => handleSelect('Recogida en tienda')}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <IconSymbol
                name="bag.fill"
                size={24}
                color={tempSelectedMode === 'Recogida en tienda' ? activeColor : iconColor}
              />
              <View style={styles.textContainer}>
                <ThemedText type="defaultSemiBold" style={tempSelectedMode === 'Recogida en tienda' ? { color: activeColor } : undefined}>Recogida en tienda</ThemedText>
                <ThemedText style={[styles.description, { color: iconColor }]}>
                  Recoge tu pedido en la tienda más cercana.
                </ThemedText>
              </View>
            </View>
            <View style={[styles.radio, tempSelectedMode === 'Recogida en tienda' && { borderColor: activeColor }]}>
                {tempSelectedMode === 'Recogida en tienda' && <View style={[styles.radioSelected, { backgroundColor: activeColor }]} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              tempSelectedMode === 'Ubicación actual'
                ? { backgroundColor: lightPrimary, borderColor: activeColor }
                : { backgroundColor: greyBackground, borderColor: 'transparent' }
            ]}
            onPress={() => handleSelect('Ubicación actual')}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <IconSymbol
                name="location.fill"
                size={24}
                color={tempSelectedMode === 'Ubicación actual' ? activeColor : iconColor}
              />
              <View style={styles.textContainer}>
                <ThemedText type="defaultSemiBold" style={tempSelectedMode === 'Ubicación actual' ? { color: activeColor } : undefined}>Ubicación actual</ThemedText>
                <ThemedText style={[styles.description, { color: iconColor }]}>
                  Recibe tu pedido donde estés.
                </ThemedText>
              </View>
            </View>
            <View style={[styles.radio, tempSelectedMode === 'Ubicación actual' && { borderColor: activeColor }]}>
                {tempSelectedMode === 'Ubicación actual' && <View style={[styles.radioSelected, { backgroundColor: activeColor }]} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: activeColor }]}
            onPress={() => {
              onSelect(tempSelectedMode);
              onClose();
            }}
          >
            <ThemedText type="defaultSemiBold" style={styles.confirmButtonText}>
              Confirmar
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
    borderRadius: 16,
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
  confirmButton: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      alignItems: 'center',
      justifyContent: 'center',
  },
  radioSelected: {
      width: 10,
      height: 10,
      borderRadius: 5,
  }
});
