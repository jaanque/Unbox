import React, { useMemo } from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Colors } from '@/constants/theme';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { IconSymbol } from './ui/icon-symbol';

interface LocationBottomSheetProps {
  onSelect: (mode: 'current' | 'pickup') => void;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onChange?: (index: number) => void;
  selectedMode: 'current' | 'pickup';
}

export default function LocationBottomSheet({ onSelect, bottomSheetRef, onChange, selectedMode }: LocationBottomSheetProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const backgroundColor = Colors[theme].background;
  const textColor = Colors[theme].text;

  // variables
  const snapPoints = useMemo(() => ['40%'], []);

  const handleSelect = (mode: 'current' | 'pickup') => {
    onSelect(mode);
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      index={-1} // Closed by default
      backgroundStyle={{ backgroundColor }}
      handleIndicatorStyle={{ backgroundColor: Colors[theme].icon }}
      onChange={onChange}
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={[styles.title, { color: textColor }]}>Selecciona ubicación</Text>

        <TouchableOpacity
          style={[
            styles.option,
            selectedMode === 'current' && { backgroundColor: Colors[theme].tint + '10', borderColor: Colors[theme].tint, borderWidth: 1 }
          ]}
          onPress={() => handleSelect('current')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors[theme].tint + '20' }]}>
             <IconSymbol name="location.fill" size={24} color={Colors[theme].tint} />
          </View>
          <View style={styles.textContainer}>
             <Text style={[styles.optionText, { color: textColor }]}>Ubicación actual</Text>
             <Text style={[styles.optionSubtext, { color: Colors[theme].icon }]}>Usar mi ubicación GPS</Text>
          </View>
          {selectedMode === 'current' && (
            <IconSymbol name="checkmark" size={20} color={Colors[theme].tint} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            selectedMode === 'pickup' && { backgroundColor: Colors[theme].tint + '10', borderColor: Colors[theme].tint, borderWidth: 1 }
          ]}
          onPress={() => handleSelect('pickup')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors[theme].tint + '20' }]}>
             <IconSymbol name="bag.fill" size={24} color={Colors[theme].tint} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.optionText, { color: textColor }]}>Recogida en tienda</Text>
            <Text style={[styles.optionSubtext, { color: Colors[theme].icon }]}>Seleccionar una tienda cercana</Text>
          </View>
          {selectedMode === 'pickup' && (
            <IconSymbol name="checkmark" size={20} color={Colors[theme].tint} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: Colors[theme].icon + '20' }]} onPress={() => bottomSheetRef.current?.close()}>
            <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancelar</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtext: {
      fontSize: 14,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
