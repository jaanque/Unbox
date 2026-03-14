import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
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

export function CategoriesSection({ selectedCategoryId, onSelectCategory }: CategoriesSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);

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
        console.warn('Error fetching categories:', error.message);
      } else if (data) {
        setCategories(data);
      }
    } catch (e) {
      console.warn('Exception fetching categories:', e);
    }
  };

  const handlePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCategory(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BOTÓN: TODOS */}
        <TouchableOpacity
          style={[
            styles.pill,
            !selectedCategoryId && styles.pillSelected
          ]}
          onPress={() => handlePress('')}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.pillText}>
            Todos
          </ThemedText>
        </TouchableOpacity>

        {/* CATEGORÍAS DINÁMICAS */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                isSelected && styles.pillSelected
              ]}
              onPress={() => handlePress(cat.id)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.pillText}>
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
    marginVertical: 14,
  },
  scrollContent: {
    paddingHorizontal: 20, // Match other sections
    gap: 8, // More compact like iOS
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    // Sketchy wobbly corners
    borderTopLeftRadius: 16,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 14,
  },
  pillSelected: {
    backgroundColor: '#E29E2E', // Amber accent
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    transform: [{ rotate: '-1deg' }],
  },
  pillText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.24,
  },
});