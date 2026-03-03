import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders') 
        .select(`
          id,
          status,
          created_at,
          total,
          ofertas:offer_id (title, image_url),
          locales:local_id (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'pagado') return { color: '#10B981', label: 'Pagado' };
    if (s === 'pickup' || s === 'recogida') return { color: '#3B82F6', label: 'Recogida' };
    return { color: '#6B7280', label: s.toUpperCase() };
  };

  const renderOrderItem = ({ item, index }: { item: any; index: number }) => {
    const status = getStatusStyle(item.status);
    const date = new Date(item.created_at).toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'short' 
    });

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 30).duration(400)}
        layout={LinearTransition}
      >
        <TouchableOpacity 
          style={styles.orderCard}
          activeOpacity={0.8}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          {/* 1. Imagen a la izquierda (Tamaño generoso) */}
          <View style={styles.imageContainer}>
            {item.ofertas?.image_url ? (
              <Image source={{ uri: item.ofertas.image_url }} style={styles.orderImage} />
            ) : (
              <View style={styles.placeholderIcon}>
                <IconSymbol name="bag.fill" size={28} color="#333" />
              </View>
            )}
          </View>

          {/* 2. Contenido de Información (Estructura de Bloques con Gap) */}
          <View style={styles.infoContent}>
            
            {/* Fila Superior: Badge y Fecha (Separados del resto) */}
            <View style={styles.topRow}>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <ThemedText style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </ThemedText>
              </View>
              <ThemedText style={styles.dateText}>{date}</ThemedText>
            </View>

            {/* Fila Central: Títulos (Con margen superior e inferior) */}
            <View style={styles.titlesContainer}>
              <ThemedText style={styles.offerTitle} numberOfLines={1}>
                {item.ofertas?.title || 'Pedido Unbox'}
              </ThemedText>
              <ThemedText style={styles.partnerName} numberOfLines={1}>
                {item.locales?.name || 'Establecimiento'}
              </ThemedText>
            </View>

            {/* Fila Inferior: Precio e Indicador */}
            <View style={styles.bottomRow}>
              <ThemedText style={styles.priceText}>
                {Number(item.total || 0).toFixed(2)}€
              </ThemedText>
              <View style={styles.iconCircle}>
                <IconSymbol name="chevron.right" size={12} color="#9CA3AF" />
              </View>
            </View>

          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: 'Mis Pedidos',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#f8f6f6' },
        headerTitleStyle: { fontWeight: '900', fontSize: 18, color: '#11181C' }
      }} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#333" />
        </View>
      ) : (
        <Animated.FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyTitle}>No tienes pedidos</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },

  // CARD: Diseño robusto y espaciado
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start', // Cambiado a flex-start para evitar estiramientos raros
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // IMAGEN
  imageContainer: {
    width: 100,
    height: 100,
  },
  orderImage: {
    width: 100,
    height: 100,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 18,
    backgroundColor: '#f8f6f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // INFO CONTENT (Sin altura fija para que respire según contenido)
  infoContent: {
    flex: 1,
    marginLeft: 18,
    paddingTop: 2,
  },

  // 1. FILA ESTADO (Con margen inferior claro)
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // ESPACIO DE SEGURIDAD
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8f6f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  dateText: { fontSize: 11, color: '#9CA3AF', fontWeight: '700' },

  // 2. FILA TÍTULOS (Centrada visualmente)
  titlesContainer: {
    marginBottom: 14, // ESPACIO DE SEGURIDAD
  },
  offerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#11181C',
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  partnerName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },

  // 3. FILA PRECIO
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#11181C',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8f6f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#11181C' },
});