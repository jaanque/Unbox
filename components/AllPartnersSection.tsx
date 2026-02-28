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
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#11181C',
    marginBottom: 20,
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
    height: 130, // Un poco más alta para lucir la foto
    borderRadius: 22, // Redondeado "chunky" solo en la imagen
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#fff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // Sombra mínima para que se vea sobre la foto
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    paddingTop: 10,
    paddingHorizontal: 2, // Alineado con el borde de la imagen
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#11181C',
    letterSpacing: -0.4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#11181C',
  },
});