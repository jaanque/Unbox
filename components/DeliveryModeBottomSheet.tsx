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
          <View style={styles.sheetHeader}>
            <ThemedText type="subtitle" style={styles.title}>
              Modo de entrega
            </ThemedText>
          </View>

          <View style={styles.listContainer}>
            <TouchableOpacity
              style={[styles.option, styles.optionBorder]}
              onPress={() => handleSelect('Recogida en tienda')}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <IconSymbol
                  name="bag.fill"
                  size={22}
                  color={selectedMode === 'Recogida en tienda' ? activeColor : iconColor}
                />
                <ThemedText
                  style={[
                    styles.optionText,
                    {
                      color: selectedMode === 'Recogida en tienda' ? activeColor : iconColor,
                      fontWeight: selectedMode === 'Recogida en tienda' ? '700' : '500'
                    }
                  ]}
                >
                  Recogida en tienda
                </ThemedText>
              </View>
              {selectedMode === 'Recogida en tienda' && (
                <IconSymbol name="checkmark" size={20} color={activeColor} />
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
                  size={22}
                  color={selectedMode === 'Ubicación actual' ? activeColor : iconColor}
                />
                <ThemedText
                  style={[
                    styles.optionText,
                    {
                      color: selectedMode === 'Ubicación actual' ? activeColor : iconColor,
                      fontWeight: selectedMode === 'Ubicación actual' ? '700' : '500'
                    }
                  ]}
                >
                  Ubicación actual
                </ThemedText>
              </View>
              {selectedMode === 'Ubicación actual' && (
                <IconSymbol name="checkmark" size={20} color={activeColor} />
              )}
            </TouchableOpacity>
          </View>

        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
  },
});
