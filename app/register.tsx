import { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Éxito', 'Por favor verifica tu correo electrónico para confirmar tu cuenta.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Registrarse', headerBackTitle: 'Atrás' }} />

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Correo electrónico</ThemedText>
          <TextInput
            style={[styles.input, { color: Colors[theme].text, backgroundColor: '#f0f0f0' }]}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Contraseña</ThemedText>
          <TextInput
            style={[styles.input, { color: Colors[theme].text, backgroundColor: '#f0f0f0' }]}
            placeholder="********"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: Colors[theme].tint }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Registrarse</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace('/login')}
        >
          <ThemedText style={[styles.linkText, { color: Colors[theme].tint }]}>
            ¿Ya tienes cuenta? Inicia sesión
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  form: {
    gap: 20,
    marginTop: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
