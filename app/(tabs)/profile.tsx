import { StyleSheet, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Session } from '@supabase/supabase-js';
import { SkeletonProfile } from '@/components/Skeletons';

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
      setRefreshing(false);
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
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
    setLoading(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
         <View style={styles.header}>
            <ThemedText type="title">Perfil</ThemedText>
        </View>
        <View style={styles.content}>
           <SkeletonProfile />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors[theme].tint} />}
      >
        <View style={styles.header}>
            <ThemedText type="title">Perfil</ThemedText>
        </View>

        <View style={styles.content}>
            {session && session.user ? (
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                <IconSymbol name="person.crop.circle" size={80} color={Colors[theme].text} />
                </View>
                <ThemedText style={styles.emailText}>{session.user.email}</ThemedText>

                <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleSignOut}
                >
                <ThemedText style={styles.logoutButtonText}>Cerrar Sesión</ThemedText>
                </TouchableOpacity>
            </View>
            ) : (
            <View style={styles.authSection}>
                <View style={styles.welcomeContainer}>
                <IconSymbol name="person.crop.circle" size={60} color={Colors[theme].icon} />
                <ThemedText type="subtitle" style={styles.welcomeText}>Bienvenido a Unbox</ThemedText>
                <ThemedText style={styles.subWelcomeText}>Inicia sesión o regístrate para continuar</ThemedText>
                </View>

                <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: Colors[theme].tint }]}
                    onPress={() => router.push('/login')}
                >
                    <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.outlineButton, { borderColor: Colors[theme].tint }]}
                    onPress={() => router.push('/register')}
                >
                    <ThemedText style={[styles.outlineButtonText, { color: Colors[theme].tint }]}>Registrarse</ThemedText>
                </TouchableOpacity>
                </View>
            </View>
            )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
      flexGrow: 1,
      padding: 20,
      justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60, // Account for header
  },
  profileSection: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  authSection: {
    width: '100%',
    gap: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    gap: 10,
  },
  welcomeText: {
    marginTop: 10,
    textAlign: 'center',
  },
  subWelcomeText: {
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
