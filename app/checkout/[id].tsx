import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useStripe } from '@stripe/stripe-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OfferDetail {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  image_url: string;
  local_id: string;
  locales?: {
    name: string;
    stripe_account_id?: string;
  };
}

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const offerId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [serviceFee, setServiceFee] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    fetchServiceFee();
    if (offerId) {
      fetchOfferDetails();
    }
  }, [offerId]);

  const fetchServiceFee = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'service_fee')
        .single();
      
      if (data && data.value) {
        setServiceFee(parseFloat(data.value));
      } else {
        console.warn('Service fee not found in settings, defaulting to 0');
        setServiceFee(0);
      }
    } catch (e) {
      console.error('Error fetching service fee:', e);
      setServiceFee(0); // Fallback safe
    }
  };

  const fetchOfferDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('ofertas')
        .select(`
          id,
          title,
          price,
          original_price,
          image_url,
          local_id,
          locales (name, stripe_account_id)
        `)
        .eq('id', offerId)
        .single();

      if (error) {
        console.error('Error fetching offer details:', error);
        Alert.alert('Error', 'No se pudo cargar la oferta.');
        router.back();
      } else {
        // PARCHE: Asegurarnos de que locales es un objeto y forzar el tipo para TypeScript
        const formattedData = {
          ...data,
          locales: Array.isArray(data.locales) ? data.locales[0] : data.locales
        } as unknown as OfferDetail;

        setOffer(formattedData);
      }
    } catch (e) {
      console.error('Exception fetching offer details:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSheetParams = async () => {
    if (!offer || serviceFee === null) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
            amount: offer.price + serviceFee,
            application_fee_amount: serviceFee,
            local_stripe_account_id: offer.locales?.stripe_account_id,
        },
      });

      // AQUÍ ESTÁ EL NUEVO BLOQUE PARA CAZAR EL ERROR EXACTO
      if (error) {
          console.error("Function error raw:", error);
          let mensaje = error.message;
          try {
             // Extraemos el mensaje oculto que nos manda la Edge Function
             if ((error as any).context) {
                const errorBody = await (error as any).context.json();
                mensaje = errorBody.error || mensaje;
             }
          } catch(e) {}
          
          Alert.alert('Error devuelto por Stripe:', mensaje);
          throw new Error('Error al inicializar pago');
      }

      if (!data?.paymentIntent) {
           console.error("Missing paymentIntent in response", data);
           throw new Error('Respuesta de pago inválida');
      }

      return {
        paymentIntent: data.paymentIntent,
      };
    } catch (e) {
        console.error("Fetch params exception:", e);
        // Si ya mostramos la alerta de Stripe arriba, evitamos mostrar esta genérica
        if (e instanceof Error && e.message !== 'Error al inicializar pago') {
            Alert.alert('Error', 'No se pudo conectar con el servidor de pagos.');
        }
        return null;
    }
  };

  const handlePayment = async () => {
    if (!offer || serviceFee === null) return;

    if (!offer.locales?.stripe_account_id) {
         Alert.alert("Aviso", "Este local aún no acepta pagos en línea. (Falta stripe_account_id)");
         return; 
    }

    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para realizar un pedido.');
        router.push('/login');
        setProcessing(false);
        return;
      }

      // 1. Fetch Payment Params
      const params = await fetchPaymentSheetParams();
      if (!params) {
          setProcessing(false);
          return;
      }

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Unbox",
        paymentIntentClientSecret: params.paymentIntent,
        returnURL: 'unbox://stripe-redirect',
        defaultBillingDetails: {
            name: 'Customer Name', // Idealmente sacar esto del perfil del usuario
        }
      });

      if (initError) {
          console.error(initError);
          Alert.alert('Error', 'No se pudo abrir la pasarela de pago.');
          setProcessing(false);
          return;
      }

      // 3. Present Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // Payment cancelled or failed
        console.log(paymentError);
        setProcessing(false);
      } else {
        // 4. Success - Create Order in Supabase
        const commission = serviceFee;
        const total = offer.price + commission;

        const { error: orderError } = await supabase.from('orders').insert({
            user_id: user.id,
            offer_id: offer.id,
            local_id: offer.local_id,
            price: offer.price,
            commission: commission,
            total: total,
            customer_notes: customerNotes,
            status: 'paid', // Confirmed payment
            payment_intent_id: params.paymentIntent, // Store PI ID
            application_fee: commission,
        });

        if (orderError) {
            console.error('Error creating order:', orderError);
            Alert.alert('Aviso', 'Pago exitoso, pero hubo un error guardando el pedido. Contacta soporte.');
        }

        setSuccess(true);
        setProcessing(false);
      }
    } catch (e) {
      console.error('Exception processing payment:', e);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[theme].tint} />
      </ThemedView>
    );
  }

  if (success) {
    return (
      <ThemedView style={styles.successContainer}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.successIconContainer}>
            <IconSymbol name="checkmark" size={48} color="#fff" />
          </View>
          <ThemedText type="title" style={styles.successTitle}>¡Pago realizado!</ThemedText>
          <ThemedText style={styles.successSubtitle}>
            Tu pedido ha sido confirmado. Puedes ver los detalles en tu perfil.
          </ThemedText>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#5A228B', marginTop: 32 }]}
            onPress={() => router.navigate('/(tabs)')}
          >
            <ThemedText style={styles.primaryButtonText}>Volver a inicio</ThemedText>
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Atrás' }} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Order Summary */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Resumen del pedido</ThemedText>
            {offer && (
              <View style={styles.orderCard}>
                <Image source={{ uri: offer.image_url }} style={styles.orderImage} />
                <View style={styles.orderInfo}>
                  <ThemedText style={styles.orderTitle} numberOfLines={2}>{offer.title}</ThemedText>
                  <ThemedText style={styles.partnerName}>{offer.locales?.name}</ThemedText>
                  <View style={styles.priceRow}>
                    <ThemedText style={styles.price}>{offer.price.toFixed(2)}€</ThemedText>
                    {offer.original_price && (
                      <ThemedText style={styles.originalPrice}>{offer.original_price.toFixed(2)}€</ThemedText>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Customer Notes */}
          <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Instrucciones especiales</ThemedText>
              <TextInput
                  style={styles.notesInput}
                  placeholder="Detalles por parte del cliente (alergias, etc.)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={customerNotes}
                  onChangeText={setCustomerNotes}
                  textAlignVertical="top"
              />
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Método de pago</ThemedText>
            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentIcon}>
                <IconSymbol name="creditcard" size={24} color="#4B5563" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.paymentText}>Tarjeta de crédito / débito</ThemedText>
                <ThemedText style={styles.paymentSubtext}>Procesado por Stripe</ThemedText>
              </View>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Oferta</ThemedText>
              <ThemedText style={styles.totalValue}>{offer?.price.toFixed(2)}€</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Comisión de servicio</ThemedText>
              <ThemedText style={styles.totalValue}>{serviceFee?.toFixed(2) ?? '...'}€</ThemedText>
            </View>
            <View style={[styles.totalRow, styles.totalBold]}>
              <ThemedText type="subtitle">Total</ThemedText>
              <ThemedText type="subtitle" style={{ color: '#5A228B' }}>
                {(offer && serviceFee !== null) ? (offer.price + serviceFee).toFixed(2) : '...'}€
              </ThemedText>
            </View>
          </View>

        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: (processing || serviceFee === null) ? '#9CA3AF' : '#5A228B' }]}
            onPress={handlePayment}
            disabled={processing || serviceFee === null}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Confirmar y Pagar</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successContainer: { flex: 1, backgroundColor: '#fff', padding: 20 },
  successIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  successSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32, lineHeight: 24 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#11181C' },
  orderCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, gap: 16 },
  orderImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F3F4F6' },
  orderInfo: { flex: 1, justifyContent: 'center' },
  orderTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  partnerName: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 16, fontWeight: '700', color: '#5A228B' },
  originalPrice: { fontSize: 14, color: '#9CA3AF', textDecorationLine: 'line-through' },
  notesInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#11181C', minHeight: 80 },
  paymentMethodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 16 },
  paymentIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  paymentText: { fontSize: 16, fontWeight: '500' },
  paymentSubtext: { fontSize: 14, color: '#6B7280' },
  totalSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, color: '#6B7280' },
  totalValue: { fontSize: 15, fontWeight: '500', color: '#11181C' },
  totalBold: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  primaryButton: { width: '100%', paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});