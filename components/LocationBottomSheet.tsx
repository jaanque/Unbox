import React, { useMemo } from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Colors } from '@/constants/theme';
import { TouchableOpacity } from 'react-native-gesture-handler';

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
  const snapPoints = useMemo(() => ['25%'], []);

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

        <TouchableOpacity style={styles.option} onPress={() => handleSelect('current')}>
          <Text style={[styles.optionText, { color: textColor }]}>Ubicación actual</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => handleSelect('pickup')}>
          <Text style={[styles.optionText, { color: textColor }]}>Recogida en tienda</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  optionText: {
    fontSize: 16,
  },
});
