import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
        {dataToRender.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const backgroundColor = isSelected ? cat.hex_color : Colors[theme].background;
          const borderColor = isSelected ? cat.hex_color : '#E5E7EB';

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
              <IconSymbol
                name={cat.icon_slug as any}
                size={18}
                color={isSelected ? '#000' : Colors[theme].text}
                style={styles.icon}
              />
              <ThemedText style={[styles.pillText, isSelected && styles.selectedText]}>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    fontWeight: '700',
    color: '#000',
  },
  icon: {
    // Icon styles
  }
});
