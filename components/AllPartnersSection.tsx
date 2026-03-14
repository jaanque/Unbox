import { SkeletonCard } from '@/components/Skeletons';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
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

  useEffect(() => {
    fetchLocales();
  }, [refreshTrigger]);

  const fetchLocales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locales')
        .select('id, name, image_url, rating')
        .order('name', { ascending: true });

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
        <ThemedText style={styles.sectionTitle}>Todos los locales</ThemedText>
        <View style={styles.grid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.skeletonWrapper}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (locales.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Todos los locales</ThemedText>

      <View style={styles.grid}>
        {locales.map((local) => (
          <TouchableOpacity
            key={local.id}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(local.id, local.name);
            }}
            style={styles.card}
          >
            {/* Imagen sin box de fondo, con redondeado marcado */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: local.image_url }} style={styles.image} />

              {/* Badge de rating minimalista sobre la imagen */}
              <View style={styles.ratingBadge}>
                <IconSymbol name="star.fill" size={10} color="#333" />
                <ThemedText style={styles.ratingText}>
                  {local.rating ? local.rating.toFixed(1) : 'Nuevo'}
                </ThemedText>
              </View>
            </View>

            {/* Contenido directo sobre el fondo de la app */}
            <View style={styles.content}>
              <ThemedText numberOfLines={1} style={styles.name}>{local.name}</ThemedText>
              <View style={styles.tagRow}>
                <ThemedText style={styles.tagline}>Local verificado</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
// Ajuste de margen para que respiren entre ellas
const cardWidth = (width - 40 - 16) / 2;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 20,
    transform: [{ rotate: '-1deg' }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonWrapper: {
    width: cardWidth,
    height: 160,
    borderRadius: 22,
    marginBottom: 24,
  },
  card: {
    width: cardWidth,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    // Organic wobbly feel
    borderTopLeftRadius: 18,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 24,
    padding: 2,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    // Irregular radii that fit the parent card but allow overflow hidden
    borderTopLeftRadius: 16,
    borderTopRightRadius: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#1a1a1a',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E29E2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
  },
});