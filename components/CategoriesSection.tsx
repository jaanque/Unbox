import { ThemedText } from '@/components/themed-text';
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
    onSelectCategory(id);
  };

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
              backgroundColor: !selectedCategoryId ? '#11181C' : '#ffffff',
              borderColor: !selectedCategoryId ? '#11181C' : '#E5E7EB',
            }
          ]}
          onPress={() => onSelectCategory('')} 
          activeOpacity={0.7}
        >
          <ThemedText style={[
            styles.pillText,
            { color: !selectedCategoryId ? '#ffffff' : '#11181C' }
          ]}>
            All Items
          </ThemedText>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          
          // El color de la DB se aplica solo si está seleccionado. Si no, fondo blanco.
          const backgroundColor = isSelected ? (cat.hex_color || '#E5E7EB') : '#ffffff';
          const borderColor = isSelected ? (cat.hex_color || '#E5E7EB') : '#E5E7EB';
          const textColor = '#11181C';

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