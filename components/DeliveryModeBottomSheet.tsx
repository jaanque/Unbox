import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export type DeliveryMode = 'Recogida en tienda' | 'Ubicación actual';

interface DeliveryModeBottomSheetProps {
  onSelect: (mode: DeliveryMode) => void;
  onClose: () => void;
}

export const DeliveryModeBottomSheet = forwardRef<BottomSheet, DeliveryModeBottomSheetProps>(
  ({ onSelect, onClose }, ref) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const snapPoints = useMemo(() => ['25%'], []);

    const handleSelect = (mode: DeliveryMode) => {
      Haptics.selectionAsync();
      onSelect(mode);
      onClose();
    };

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
          <ThemedText type="subtitle" style={styles.title}>
            Selecciona el modo de entrega
          </ThemedText>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleSelect('Recogida en tienda')}
          >
            <IconSymbol name="bag.fill" size={24} color={Colors[theme].icon} />
            <ThemedText style={styles.optionText}>Recogida en tienda</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleSelect('Ubicación actual')}
          >
            <IconSymbol name="location.fill" size={24} color={Colors[theme].icon} />
            <ThemedText style={styles.optionText}>Ubicación actual</ThemedText>
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
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  optionText: {
    fontSize: 18,
  },
});
