import React, { useMemo } from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Colors } from '@/constants/theme';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { IconSymbol } from './ui/icon-symbol';

interface LocationBottomSheetProps {
  onSelect: (mode: 'current' | 'pickup') => void;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
}

export default function LocationBottomSheet({ onSelect, bottomSheetRef }: LocationBottomSheetProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const backgroundColor = Colors[theme].background;
  const textColor = Colors[theme].text;

  // variables
  const snapPoints = useMemo(() => ['30%'], []);

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
    >
      <BottomSheetView style={styles.contentContainer}>
        <Text style={[styles.title, { color: textColor }]}>Selecciona ubicación</Text>

        <TouchableOpacity style={styles.option} onPress={() => handleSelect('current')} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: Colors[theme].tint + '20' }]}>
             <IconSymbol name="location.fill" size={24} color={Colors[theme].tint} />
          </View>
          <View style={styles.textContainer}>
             <Text style={[styles.optionText, { color: textColor }]}>Ubicación actual</Text>
             <Text style={[styles.optionSubtext, { color: Colors[theme].icon }]}>Usar mi ubicación GPS</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => handleSelect('pickup')} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: Colors[theme].tint + '20' }]}>
             <IconSymbol name="bag.fill" size={24} color={Colors[theme].tint} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.optionText, { color: textColor }]}>Recogida en tienda</Text>
            <Text style={[styles.optionSubtext, { color: Colors[theme].icon }]}>Seleccionar una tienda cercana</Text>
          </View>
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
    marginBottom: 12,
    borderRadius: 12,
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
  }
});
