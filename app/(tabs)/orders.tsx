import { StyleSheet, FlatList, View, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SkeletonListTile } from '@/components/Skeletons';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  ofertas: {
    title: string;
    image_url: string;
  };
  locales: {
    name: string;
  };
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const fetchOrders = async () => {
    if (!refreshing) setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total,
          status,
          ofertas (title, image_url),
          locales (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return '#10B981'; // Green
      case 'pending':
        return '#F59E0B'; // Amber
      case 'cancelled':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && orders.length === 0) {
      return (
        <ThemedView style={styles.container}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
             <View style={styles.header}>
                <ThemedText type="title">Mis Pedidos</ThemedText>
             </View>
             <View style={styles.listContent}>
                {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonListTile key={index} />
                ))}
             </View>
          </SafeAreaView>
        </ThemedView>
      );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
            <ThemedText type="title">Mis Pedidos</ThemedText>
        </View>

        {orders.length === 0 ? (
             <View style={styles.emptyContainer}>
                <IconSymbol name="bag.fill" size={60} color={Colors[theme].icon} />
                <ThemedText type="subtitle" style={styles.emptyText}>No tienes pedidos aún</ThemedText>
                <ThemedText style={styles.subEmptyText}>Tus compras aparecerán aquí.</ThemedText>
            </View>
        ) : (
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors[theme].tint} />}
                renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <ThemedText style={styles.localName}>{item.locales?.name}</ThemedText>
                            <ThemedText style={styles.orderDate}>{formatDate(item.created_at)}</ThemedText>
                        </View>

                        <View style={styles.orderBody}>
                             <ThemedText style={styles.offerTitle} numberOfLines={1}>{item.ofertas?.title}</ThemedText>
                             <ThemedText style={styles.orderTotal}>{item.total.toFixed(2)}€</ThemedText>
                        </View>

                        <View style={styles.orderFooter}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                    {getStatusText(item.status)}
                                </ThemedText>
                            </View>
                            {/* Potential "View Details" or "Rate" button here */}
                        </View>
                    </View>
                )}
            />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  subEmptyText: {
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  orderCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 16,
  },
  orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  localName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#11181C',
  },
  orderDate: {
      fontSize: 12,
      color: '#6B7280',
  },
  orderBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  offerTitle: {
      fontSize: 14,
      color: '#4B5563',
      flex: 1,
      marginRight: 8,
  },
  orderTotal: {
      fontSize: 16,
      fontWeight: '700',
      color: '#5A228B',
  },
  orderFooter: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  statusText: {
      fontSize: 12,
      fontWeight: '600',
  },
});
