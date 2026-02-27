import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Category {
  id: string;
  name: string;
  icon_slug: string;
  hex_color: string;
}

interface CategoriesSectionProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
}

// Fallback data in case DB is not migrated yet or fetch fails
const FALLBACK_CATEGORIES: Category[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Comidas', icon_slug: 'bag.fill', hex_color: '#E3F2FD' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Panadería', icon_slug: 'carrot.fill', hex_color: '#FFF3E0' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Super', icon_slug: 'cart.fill', hex_color: '#E8F5E9' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Postres', icon_slug: 'birthday.cake.fill', hex_color: '#FCE4EC' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Bebidas', icon_slug: 'cup.and.saucer.fill', hex_color: '#EFEBE9' },
];

export function CategoriesSection({ selectedCategoryId, onSelectCategory }: CategoriesSectionProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.warn('Error fetching categories (using fallback):', error.message);
        setCategories(FALLBACK_CATEGORIES);
      } else if (data && data.length > 0) {
        setCategories(data);
      } else {
         setCategories(FALLBACK_CATEGORIES);
      }
    } catch (e) {
      console.warn('Exception fetching categories (using fallback):', e);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (id: string) => {
    onSelectCategory(id);
  };

  const dataToRender = categories.length > 0 ? categories : (loading ? [] : FALLBACK_CATEGORIES);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.pill,
            {
              backgroundColor: !selectedCategoryId ? '#1a3d2c' : '#ffffff',
              borderColor: !selectedCategoryId ? '#1a3d2c' : '#E5E7EB',
            }
          ]}
          onPress={() => onSelectCategory('')} // or null? The parent usually toggles. Let's assume clicking "All" clears selection.
          activeOpacity={0.7}
        >
          <ThemedText style={[
            styles.pillText,
            { color: !selectedCategoryId ? '#ffffff' : '#11181C' }
          ]}>
            All Items
          </ThemedText>
        </TouchableOpacity>

        {dataToRender.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          
          const backgroundColor = isSelected ? '#1a3d2c' : '#ffffff';
          const borderColor = isSelected ? '#1a3d2c' : '#E5E7EB';
          const textColor = isSelected ? '#ffffff' : '#11181C';

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                { backgroundColor, borderColor }
              ]}
              onPress={() => handlePress(cat.id)}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.pillText, { color: textColor }]}>
                {cat.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20, // Fully rounded
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
