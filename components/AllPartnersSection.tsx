import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Local {
  id: string;
  name: string;
  image_url: string;
  rating?: number;
}

interface AllPartnersSectionProps {
  onSelect: (id: string, name: string) => void;
  refreshTrigger?: number;
}

export function AllPartnersSection({ onSelect, refreshTrigger = 0 }: AllPartnersSectionProps) {
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  useEffect(() => {
    fetchLocales();
  }, [refreshTrigger]);

  const fetchLocales = async () => {
    try {
      const { data, error } = await supabase
        .from('locales')
        .select('id, name, image_url, rating')
        .order('name', { ascending: true }); // Alphabetical order for "All"

      if (error) {
        console.error('Error fetching locales:', error);
      } else if (data) {
        setLocales(data);
      }
    } catch (e) {
      console.error('Exception fetching locales:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Todos los locales</ThemedText>
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, index) => (
             <View key={index} style={styles.skeletonContainer}>
                <SkeletonCard />
             </View>
          ))}
        </View>
      </View>
    );
  }

  if (locales.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>Todos los locales</ThemedText>

      <View style={styles.grid}>
        {locales.map((local) => (
          <TouchableOpacity
            key={local.id}
            activeOpacity={0.9}
            onPress={() => onSelect(local.id, local.name)}
            style={[
                styles.card,
                { backgroundColor: Colors[theme].background },
                styles.shadow
            ]}
          >
            <View style={styles.imageContainer}>
                <Image source={{ uri: local.image_url }} style={styles.image} />
            </View>
            <View style={styles.content}>
                <ThemedText numberOfLines={1} style={styles.name}>{local.name}</ThemedText>
                <View style={styles.ratingContainer}>
                    <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                    <ThemedText style={styles.ratingText}>
                        {local.rating ? local.rating.toFixed(1) : 'Nuevo'}
                    </ThemedText>
                </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 32 - 16) / 2; // (Screen - padding - gap) / 2

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  skeletonContainer: {
      width: cardWidth,
      height: 180,
      overflow: 'hidden',
      borderRadius: 6,
  },
  card: {
    width: cardWidth,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  shadow: {},
  imageContainer: {
    width: '100%',
    height: 100, // Compact height for grid
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    padding: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#11181C',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
});
