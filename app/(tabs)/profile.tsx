import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || '');
    } catch (e) {
      console.error('Error fetching user:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres salir de Unbox?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive", 
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          } 
        }
      ]
    );
  };

  const ProfileAction = ({ icon, label, onPress, isDestructive = false }: any) => (
    <TouchableOpacity 
      style={styles.actionRow} 
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.actionLeft}>
        <View style={[styles.iconBox, isDestructive && styles.destructiveIconBox]}>
          <IconSymbol name={icon} size={20} color={isDestructive ? "#EF4444" : "#333"} />
        </View>
        <ThemedText style={[styles.actionLabel, isDestructive && { color: '#EF4444' }]}>
          {label}
        </ThemedText>
      </View>
      {!isDestructive && <IconSymbol name="chevron.right" size={14} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#333" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* --- HEADER COMPACTO --- */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <IconSymbol name="person.crop.circle" size={80} color="#333" />
          </View>
          <ThemedText style={styles.userEmail}>{email}</ThemedText>
        </Animated.View>

        {/* --- SECCIÓN: MI ACTIVIDAD --- */}
        <ThemedText style={styles.sectionLabel}>MI ACTIVIDAD</ThemedText>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <ProfileAction icon="person.crop.circle" label="Información personal" />
          <View style={styles.divider} />
          
          {/* Vínculo corregido a tu pantalla existente */}
          <ProfileAction 
            icon="location.fill" 
            label="Mis direcciones" 
            onPress={() => router.push('/profile/addresses')} 
          />
          
          <View style={styles.divider} />
          <ProfileAction icon="bag.fill" label="Métodos de pago" />
        </Animated.View>

        {/* --- SECCIÓN: PREFERENCIAS --- */}
        <ThemedText style={styles.sectionLabel}>PREFERENCIAS</ThemedText>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <ProfileAction icon="paperplane.fill" label="Notificaciones" />
          <View style={styles.divider} />
          <ProfileAction icon="magnifyingglass" label="Centro de ayuda" />
          <View style={styles.divider} />
          <ProfileAction icon="paperplane.fill" label="Términos y privacidad" />
        </Animated.View>

        {/* --- SECCIÓN: SALIDA --- */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
          <ProfileAction 
            icon="xmark.circle.fill" 
            label="Cerrar sesión" 
            isDestructive 
            onPress={handleSignOut}
          />
        </Animated.View>

        <ThemedText style={styles.footerText}>Unbox v1.0.0</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  profileHeader: {
    alignItems: 'center',
    marginBottom: 20, // Padding reducido como pediste
    marginTop: 10,
  },
  avatarWrapper: {
    marginBottom: 6, 
  },
  userEmail: {
    fontSize: 16,
    color: '#333',
    fontWeight: '800', // Un poco más de peso para que se vea consistente
    letterSpacing: -0.3,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8f6f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destructiveIconBox: {
    backgroundColor: '#FEE2E2',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
  },
  divider: {
    height: 1,
    backgroundColor: '#f8f6f6',
    marginHorizontal: 16,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '600',
  },
});