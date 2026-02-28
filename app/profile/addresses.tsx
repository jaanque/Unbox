import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Address {
  id: string;
  name: string;
  address: string;
}

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_addresses')
        .select('id, name, address')
        .eq('user_id', user.id);

      if (error) throw error;
      setAddresses(data || []);
    } catch (e) {
      console.error('Error fetching addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Eliminar dirección",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { error } = await supabase.from('user_addresses').delete().eq('id', id);
            if (!error) fetchAddresses();
          } 
        }
      ]
    );
  };

  const renderAddressItem = ({ item, index }: { item: Address, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 30).duration(400)}
      layout={LinearTransition}
    >
      <View style={styles.addressCard}>
        <View style={styles.iconBox}>
          <IconSymbol name="location.fill" size={20} color="#333" />
        </View>
        
        <View style={styles.infoContent}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.addressHeader} numberOfLines={1}>
              {item.name || 'Dirección guardada'}
            </ThemedText>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <ThemedText style={styles.addressBody} numberOfLines={2}>
            {item.address}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: 'Mis Direcciones',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerTransparent: false,
        headerStyle: { backgroundColor: '#f8f6f6' },
        headerTitleStyle: { fontWeight: '900', fontSize: 18, color: '#11181C' },
        headerLeftContainerStyle: { paddingLeft: 16 }, // Añadido para dar aire al botón
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
            }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color="#333" />
          </TouchableOpacity>
        )
      }} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#333" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddressItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyTitle}>Sin direcciones</ThemedText>
            </View>
          }
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <ThemedText style={styles.primaryButtonText}>Añadir nueva dirección</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingTop: 16 },
  
  // BOTÓN DE ATRÁS CORREGIDO
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // Sombra sutil para que no parezca plano
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Tarjetas Chunky
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f8f6f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 14,
    height: 48,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#11181C',
  },
  deleteButton: {
    padding: 2,
  },
  addressBody: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    lineHeight: 18,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#11181C' },
});