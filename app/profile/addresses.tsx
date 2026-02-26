import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface UserAddress {
  id: string;
  name: string;
  address: string;
}

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const primaryColor = '#5A228B';

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching addresses:', error);
      } else if (data) {
        setAddresses(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Eliminar dirección",
      "¿Estás seguro de que quieres eliminar esta dirección?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
             // Optimistic update
             setAddresses(prev => prev.filter(addr => addr.id !== id));
             const { error } = await supabase
                .from('user_addresses')
                .delete()
                .eq('id', id);
             if (error) {
                 console.error('Error deleting address:', error);
                 fetchAddresses(); // Revert on error
             }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
         <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.down" size={24} color={Colors[theme].text} style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
                <ThemedText type="subtitle" style={styles.headerTitle}>Direcciones guardadas</ThemedText>
            </View>
            <View style={styles.centered}>
                <ActivityIndicator color={primaryColor} />
            </View>
         </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol name="chevron.down" size={24} color={Colors[theme].text} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.headerTitle}>Direcciones guardadas</ThemedText>
             {/* Placeholder for alignment */}
             <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            {addresses.length === 0 ? (
                <View style={styles.emptyState}>
                    <IconSymbol name="location.fill" size={48} color="#D1D5DB" />
                    <ThemedText style={styles.emptyText}>No tienes direcciones guardadas.</ThemedText>
                    <ThemedText style={styles.emptySubText}>Añade direcciones al realizar un pedido o configurar tu entrega.</ThemedText>
                </View>
            ) : (
                <View style={styles.list}>
                    {addresses.map((addr) => (
                        <View key={addr.id} style={styles.addressCard}>
                            <View style={styles.iconContainer}>
                                <IconSymbol name="location.fill" size={20} color={primaryColor} />
                            </View>
                            <View style={styles.addressInfo}>
                                <ThemedText style={styles.addressName}>{addr.name}</ThemedText>
                                <ThemedText style={styles.addressText}>{addr.address}</ThemedText>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(addr.id)} style={styles.deleteButton}>
                                <IconSymbol name="trash" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
      flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
      padding: 4,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: '700',
  },
  content: {
      padding: 20,
      flexGrow: 1,
  },
  centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 100,
  },
  emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#4B5563',
  },
  emptySubText: {
      textAlign: 'center',
      color: '#9CA3AF',
      maxWidth: 240,
  },
  list: {
      gap: 12,
  },
  addressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      gap: 12,
  },
  iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F3E8FF',
      justifyContent: 'center',
      alignItems: 'center',
  },
  addressInfo: {
      flex: 1,
  },
  addressName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#11181C',
      marginBottom: 2,
  },
  addressText: {
      fontSize: 13,
      color: '#6B7280',
  },
  deleteButton: {
      padding: 8,
  },
});
