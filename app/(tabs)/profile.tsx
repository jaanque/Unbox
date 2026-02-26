import { StyleSheet, View, TouchableOpacity, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SkeletonProfile } from '@/components/Skeletons';

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  // Design tokens
  const primaryColor = '#5A228B';
  const textColor = Colors[theme].text;
  const iconColor = Colors[theme].icon;
  // Use light gray for background for better contrast
  const backgroundColor = '#ffffff';
  const secondaryBackground = '#ffffff';

  const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (e) {
          console.error(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
  };

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onRefresh = () => {
      setRefreshing(true);
      checkSession();
  };

  const handleSignOut = async () => {
    Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro de que quieres cerrar sesión?",
        [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Cerrar Sesión",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    const { error } = await supabase.auth.signOut();
                    if (error) console.error('Error signing out:', error.message);
                    setLoading(false);
                }
            }
        ]
    );
  };

  const MenuOption = ({ icon, title, subtitle, onPress, destructive = false }: { icon: string, title: string, subtitle?: string, onPress: () => void, destructive?: boolean }) => (
      <TouchableOpacity
        style={styles.menuOption}
        onPress={onPress}
        activeOpacity={0.7}
      >
          <View style={[styles.menuIconContainer, { backgroundColor: destructive ? '#FEF2F2' : '#F3F4F6' }]}>
              <IconSymbol
                name={icon as any}
                size={20}
                color={destructive ? '#DC2626' : '#4B5563'}
              />
          </View>
          <View style={styles.menuTextContainer}>
              <ThemedText style={[styles.menuTitle, destructive && { color: '#DC2626' }]}>{title}</ThemedText>
              {subtitle && <ThemedText style={styles.menuSubtitle}>{subtitle}</ThemedText>}
          </View>
          <IconSymbol name="chevron.down" size={16} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
         <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <ThemedText type="title">Perfil</ThemedText>
            </View>
            <View style={styles.content}>
                <SkeletonProfile />
            </View>
         </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
            <ThemedText type="title">Perfil</ThemedText>
        </View>

        <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
            showsVerticalScrollIndicator={false}
        >
            {session && session.user ? (
            <View style={styles.loggedInContainer}>
                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <ThemedText style={styles.avatarText}>
                            {session.user.email?.charAt(0).toUpperCase() || 'U'}
                        </ThemedText>
                    </View>
                    <View style={styles.userInfo}>
                        <ThemedText style={styles.userName}>Usuario</ThemedText>
                        <ThemedText style={styles.userEmail}>{session.user.email}</ThemedText>
                    </View>
                </View>

                {/* Account Settings Section */}
                <View style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>Cuenta</ThemedText>
                    <View style={styles.menuGroup}>
                        <MenuOption
                            icon="person.crop.circle"
                            title="Datos personales"
                            subtitle="Nombre, email, teléfono"
                            onPress={() => {}}
                        />
                        <View style={styles.separator} />
                        <MenuOption
                            icon="location.fill"
                            title="Direcciones guardadas"
                            subtitle="Casa, trabajo..."
                            onPress={() => router.push('/profile/addresses')}
                        />
                        <View style={styles.separator} />
                        <MenuOption
                            icon="creditcard" // mapped or similar
                            title="Métodos de pago"
                            onPress={() => {}}
                        />
                    </View>
                </View>

                 {/* App Settings Section */}
                 <View style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>Aplicación</ThemedText>
                    <View style={styles.menuGroup}>
                         <MenuOption
                            icon="bell" // mapped or similar. Using bag.fill as placeholder if bell not mapped yet, or handle in IconSymbol
                            title="Notificaciones"
                            onPress={() => {}}
                        />
                         <View style={styles.separator} />
                         <MenuOption
                            icon="questionmark.circle" // mapped
                            title="Ayuda y soporte"
                            onPress={() => {}}
                        />
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.sectionContainer}>
                     <View style={styles.menuGroup}>
                        <MenuOption
                            icon="arrow.right.square" // mapped or similar
                            title="Cerrar Sesión"
                            destructive
                            onPress={handleSignOut}
                        />
                     </View>
                     <ThemedText style={styles.versionText}>Versión 1.0.0</ThemedText>
                </View>

            </View>
            ) : (
            <View style={styles.loggedOutContainer}>
                <View style={styles.heroCard}>
                    <View style={styles.heroIconContainer}>
                        <IconSymbol name="person.crop.circle" size={48} color={primaryColor} />
                    </View>
                    <ThemedText type="subtitle" style={styles.heroTitle}>Bienvenido a Unbox</ThemedText>
                    <ThemedText style={styles.heroSubtitle}>
                        Disfruta de las mejores ofertas de comida cerca de ti. Inicia sesión para guardar tus favoritos y realizar pedidos.
                    </ThemedText>
                </View>

                <View style={styles.authButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                        onPress={() => router.push('/login')}
                        activeOpacity={0.8}
                    >
                        <ThemedText style={styles.primaryButtonText}>Iniciar Sesión</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push('/register')}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.secondaryButtonText, { color: primaryColor }]}>Crear cuenta</ThemedText>
                    </TouchableOpacity>
                </View>

                 <View style={styles.featuresPreview}>
                    <View style={styles.featureItem}>
                         <IconSymbol name="star.fill" size={24} color="#F59E0B" />
                         <ThemedText style={styles.featureText}>Ofertas exclusivas</ThemedText>
                    </View>
                     <View style={styles.featureItem}>
                         <IconSymbol name="location.fill" size={24} color="#10B981" />
                         <ThemedText style={styles.featureText}>Cerca de ti</ThemedText>
                    </View>
                     <View style={styles.featureItem}>
                         <IconSymbol name="heart.fill" size={24} color="#EF4444" />
                         <ThemedText style={styles.featureText}>Guarda favoritos</ThemedText>
                    </View>
                 </View>

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
  },
  safeArea: {
      flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  scrollContent: {
      paddingBottom: 80, // Increase padding to account for TabBar
  },

  // Logged In Styles
  loggedInContainer: {
      padding: 20,
      gap: 24,
  },
  userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
  },
  avatarContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#5A228B',
      justifyContent: 'center',
      alignItems: 'center',
  },
  avatarText: {
      fontSize: 24,
      fontWeight: '700',
      color: '#fff',
  },
  userInfo: {
      flex: 1,
  },
  userName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#11181C',
      marginBottom: 2,
  },
  userEmail: {
      fontSize: 14,
      color: '#6B7280',
  },
  sectionContainer: {
      gap: 12,
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginLeft: 4,
  },
  menuGroup: {
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
  },
  menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 16,
      backgroundColor: '#fff',
  },
  menuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
  },
  menuTextContainer: {
      flex: 1,
  },
  menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#11181C',
      marginBottom: 2,
  },
  menuSubtitle: {
      fontSize: 13,
      color: '#6B7280',
  },
  separator: {
      height: 1,
      backgroundColor: '#F3F4F6',
      marginLeft: 68, // Align with text
  },
  versionText: {
      textAlign: 'center',
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: 8,
  },

  // Logged Out Styles
  loggedOutContainer: {
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 500, // Ensure visual balance
      gap: 32,
  },
  heroCard: {
      alignItems: 'center',
      gap: 16,
  },
  heroIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F3E8FF', // Light purple
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  heroTitle: {
      fontSize: 24,
      fontWeight: '800',
      textAlign: 'center',
      color: '#11181C',
  },
  heroSubtitle: {
      textAlign: 'center',
      color: '#4B5563',
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 280,
  },
  authButtonsContainer: {
      width: '100%',
      gap: 12,
  },
  primaryButton: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 8, // Square slight round
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#5A228B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
  },
  primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
  },
  secondaryButton: {
      width: '100%',
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
      fontSize: 16,
      fontWeight: '700',
  },
  featuresPreview: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 16,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
  },
  featureItem: {
      alignItems: 'center',
      gap: 8,
  },
  featureText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4B5563',
  },
});
