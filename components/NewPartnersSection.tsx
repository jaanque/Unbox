import { StyleSheet, ScrollView, View, Image, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SkeletonPartner } from '@/components/Skeletons';

interface Local {
  id: string;
  name: string;
  image_url: string;
  rating?: number;
}

interface NewPartnersSectionProps {
    refreshTrigger?: number;
}

export function NewPartnersSection({ refreshTrigger = 0 }: NewPartnersSectionProps) {
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewPartners();
  }, [refreshTrigger]);

  const fetchNewPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('locales')
        .select('id, name, image_url, rating')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching new partners:', error);
      } else if (data) {
        setLocales(data);
      }
    } catch (e) {
      console.error('Exception fetching new partners:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Nuevos en Unbox</ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonPartner key={index} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (locales.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Nuevos en Unbox</ThemedText>
        <TouchableOpacity>
            <ThemedText style={styles.seeAllText}>Ver todo</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {locales.map((local) => (
          <TouchableOpacity
            key={local.id}
            activeOpacity={0.8}
            style={styles.card}
          >
            <View style={styles.imageContainer}>
                <Image source={{ uri: local.image_url }} style={styles.image} />
            </View>
            <ThemedText numberOfLines={1} style={styles.name}>{local.name}</ThemedText>
            <View style={styles.ratingContainer}>
                <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                <ThemedText style={styles.ratingText}>
                    {local.rating ? local.rating.toFixed(1) : 'Nuevo'}
                </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  seeAllText: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: 100,
    alignItems: 'center',
    gap: 6,
  },
  imageContainer: {
      width: 80,
      height: 80,
      borderRadius: 40, // Circle
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#F3F4F6',
  },
  image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
  },
  name: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      color: '#11181C',
  },
  ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
  },
  ratingText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#92400E',
  },
});
