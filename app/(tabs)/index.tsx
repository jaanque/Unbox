import { StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].text;
  const placeholderColor = Colors[theme].icon;
  const inputBackgroundColor = theme === 'dark' ? '#2C2C2E' : '#E5E5EA'; // iOS-like system gray
  const textColor = Colors[theme].text;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={[styles.inputContainer, { backgroundColor: inputBackgroundColor }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Ubicación actual"
              placeholderTextColor={placeholderColor}
            />
          </View>
          <IconSymbol name="person.crop.circle" size={32} color={iconColor} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    height: '100%',
  },
});
