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
    const snapPoints = useMemo(() => ['30%'], []);

    const handleSelect = (mode: DeliveryMode) => {
      Haptics.selectionAsync();
      onSelect(mode);
      onClose();
    };

    const activeColor = Colors[theme].text;
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
          <ThemedText type="subtitle" style={styles.title}>
            Modo de entrega
          </ThemedText>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleSelect('Recogida en tienda')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <IconSymbol
                name="bag.fill"
                size={20}
                color={selectedMode === 'Recogida en tienda' ? activeColor : iconColor}
              />
              <ThemedText
                style={[
                  styles.optionText,
                  { color: selectedMode === 'Recogida en tienda' ? activeColor : iconColor }
                ]}
              >
                Recogida en tienda
              </ThemedText>
            </View>
            {selectedMode === 'Recogida en tienda' && (
              <IconSymbol name="checkmark" size={18} color={activeColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => handleSelect('Ubicación actual')}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <IconSymbol
                name="location.fill"
                size={20}
                color={selectedMode === 'Ubicación actual' ? activeColor : iconColor}
              />
              <ThemedText
                style={[
                  styles.optionText,
                  { color: selectedMode === 'Ubicación actual' ? activeColor : iconColor }
                ]}
              >
                Ubicación actual
              </ThemedText>
            </View>
            {selectedMode === 'Ubicación actual' && (
              <IconSymbol name="checkmark" size={18} color={activeColor} />
            )}
          </TouchableOpacity>

        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});
