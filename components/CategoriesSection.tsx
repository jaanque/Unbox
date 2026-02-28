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
              backgroundColor: !selectedCategoryId ? '#E5E7EB' : '#F3F4F6',
            }
          ]}
          onPress={() => handlePress('')} 
          activeOpacity={0.8}
        >
          <ThemedText style={[
            styles.pillText,
            { 
              color: '#11181C', // Siempre oscuro
              fontWeight: !selectedCategoryId ? '900' : '600',
              opacity: !selectedCategoryId ? 1 : 0.5 // Menos opacidad si no está seleccionado
            }
          ]}>
            Todos
          </ThemedText>
        </TouchableOpacity>

        {/* CATEGORÍAS DINÁMICAS */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          
          // El fondo usa el color de la DB si está seleccionado, o un gris muy tenue si no.
          const backgroundColor = isSelected ? (cat.hex_color || '#E5E7EB') : '#F3F4F6';

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
                  color: '#11181C', // Siempre oscuro
                  fontWeight: isSelected ? '900' : '600',
                  opacity: isSelected ? 1 : 0.5 
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
    paddingHorizontal: 24, // Margen lateral para que respire
    gap: 10,
  },
  pill: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Sin bordes y sin sombras
  },
  pillText: {
    fontSize: 14,
    letterSpacing: -0.4,
  },
});