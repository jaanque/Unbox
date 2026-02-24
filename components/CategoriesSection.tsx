import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORIES = [
  { id: '1', name: 'Comidas', icon: 'bag.fill' },
  { id: '2', name: 'Panadería', icon: 'carrot.fill' },
  { id: '3', name: 'Super', icon: 'cart.fill' },
  { id: '4', name: 'Postres', icon: 'birthday.cake.fill' },
  { id: '5', name: 'Favoritos', icon: 'heart.fill' },
];

export function CategoriesSection() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, { backgroundColor: Colors[theme].background }]}
            activeOpacity={0.7}
          >
            {/* Using a placeholder text icon for robustness if actual icons fail */}
            <ThemedText style={styles.pillText}>{cat.name}</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6, // Square with slight rounding
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
