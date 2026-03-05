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
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.35,
    color: '#000',
    marginBottom: 16,
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
    marginBottom: 24, // Espacio entre filas
  },
  imageContainer: {
    width: '100%',
    height: 130, // Slightly taller
    borderRadius: 20, // Standard iOS large radius
    overflow: 'hidden',
    backgroundColor: '#E5E5EA', // Standard iOS gray
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    paddingTop: 10,
    paddingHorizontal: 2, // Alineado con el borde de la imagen
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
  },
});