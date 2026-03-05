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
            {
              backgroundColor: !selectedCategoryId ? '#E5E5EA' : '#F2F2F7', // iOS grays
            }
          ]}
          onPress={() => handlePress('')}
          activeOpacity={0.8}
        >
          <ThemedText style={[
            styles.pillText,
            {
              color: '#000', // True black
              fontWeight: !selectedCategoryId ? '600' : '400', // Subtler bold
              opacity: !selectedCategoryId ? 1 : 0.6
            }
          ]}>
            Todos
          </ThemedText>
        </TouchableOpacity>

        {/* CATEGORÍAS DINÁMICAS */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          const backgroundColor = isSelected ? (cat.hex_color || '#E5E5EA') : '#F2F2F7';

          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                { backgroundColor }
              ]}
              onPress={() => handlePress(cat.id)}
              activeOpacity={0.8}
            >
              <ThemedText style={[
                styles.pillText,
                {
                  color: '#000', // True black
                  fontWeight: isSelected ? '600' : '400',
                  opacity: isSelected ? 1 : 0.6
                }
              ]}>
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
    paddingVertical: 8, // Sleeker height
    borderRadius: 16, // Smoother pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 15, // iOS secondary text size
    letterSpacing: -0.24,
  },
});