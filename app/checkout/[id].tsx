import { DeliveryModeBottomSheet, DeliverySelection } from '@/components/DeliveryModeBottomSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import BottomSheet from '@gorhom/bottom-sheet';
import { useStripe } from '@stripe/stripe-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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

const RIDER_PRICE = 2.50;

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const offerId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliverySelection | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [serviceFee, setServiceFee] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const bottomSheetRef = useRef<BottomSheet>(null);

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

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 10)); // Max 10 items
  };

  const decrementQuantity = () => {
    setQuantity(prev => {
      if (prev <= 1) return 1;
      return prev - 1;
    });
  };

  const removeItem = () => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar este producto del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const fetchPaymentSheetParams = async () => {
    if (!offer || serviceFee === null) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const shippingCost = deliveryMethod === 'delivery' ? RIDER_PRICE : 0;

      // Ensure 2 decimal precision to avoid floating point errors
      const totalAmount = Number(((offer.price * quantity) + serviceFee + shippingCost).toFixed(2));
      const feeAmount = Number(serviceFee.toFixed(2));

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
            amount: totalAmount,
            application_fee_amount: feeAmount,
            local_stripe_account_id: offer.locales?.stripe_account_id,
        },
      });

      if (error) {
          console.error("Function error raw:", error);
          let mensaje = error.message;
          try {
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
        if (e instanceof Error && e.message !== 'Error al inicializar pago') {
            Alert.alert('Error', 'No se pudo conectar con el servidor de pagos.');
        }
        return null;
    }
  };

  const handlePayment = async () => {
    if (!offer || serviceFee === null) return;

    if (deliveryMethod === 'delivery' && !deliveryAddress) {
        Alert.alert('Falta dirección', 'Por favor, selecciona una dirección de entrega.');
        return;
    }

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
            name: 'Customer Name', 
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
        console.log(paymentError);
        setProcessing(false);
      } else {
        // 4. Success - Create Order in Supabase
        const commission = serviceFee;
        const shippingCost = deliveryMethod === 'delivery' ? RIDER_PRICE : 0;
        const total = (offer.price * quantity) + commission + shippingCost;

        const { error: orderError } = await supabase.from('orders').insert({
            user_id: user.id,
            offer_id: offer.id,
            local_id: offer.local_id,
            price: offer.price,
            quantity: quantity,
            commission: commission,
            total: total,
            customer_notes: customerNotes,
            status: 'paid', // Confirmed payment
            payment_intent_id: params.paymentIntent, 
            application_fee: commission,
            delivery_method: deliveryMethod,
            shipping_cost: shippingCost,
            delivery_address: deliveryAddress,
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
          <ThemedText type="title" style={styles.successTitle}>¡Pedido confirmado!</ThemedText>
          <ThemedText style={styles.successSubtitle}>
            Gracias por tu compra. Puedes ver los detalles de tu pedido en tu perfil.
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

  const subtotal = offer ? (offer.original_price || offer.price) * quantity : 0;
  const savings = offer && offer.original_price ? (offer.original_price - offer.price) * quantity : 0;
  const shippingCost = deliveryMethod === 'delivery' ? RIDER_PRICE : 0;
  const totalPrice = (offer && serviceFee !== null) ? ((offer.price * quantity) + serviceFee + shippingCost).toFixed(2) : '...';

  const handleOpenAddressSheet = () => {
      bottomSheetRef.current?.expand();
  };

  const handleAddressSelect = (selection: DeliverySelection) => {
      setDeliveryAddress(selection);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Carrito', headerBackTitleVisible: false, headerTitleAlign: 'center', headerTintColor: '#000', headerShadowVisible: false, headerStyle: { backgroundColor: '#fff' } }} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Product Card */}
          {offer && (
            <View style={styles.productSection}>
                <View style={styles.productCard}>
                    <Image source={{ uri: offer.image_url }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <ThemedText type="defaultSemiBold" numberOfLines={2} style={[styles.productTitle, {flex: 1, marginRight: 8}]}>
                                {offer.title}
                            </ThemedText>
                            <ThemedText style={styles.productPrice}>{((offer.original_price || offer.price) * quantity).toFixed(2)}€</ThemedText>
                        </View>
                        
                        <ThemedText style={styles.partnerName}>{offer.locales?.name}</ThemedText>
                        
                        <View style={styles.actionRow}>
                             <View style={styles.quantitySelector}>
                                <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
                                    <IconSymbol name="minus" size={16} color="#11181C" />
                                </TouchableOpacity>
                                <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
                                <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton}>
                                    <IconSymbol name="plus" size={16} color="#11181C" />
                                </TouchableOpacity>
                             </View>

                             <TouchableOpacity onPress={removeItem} style={styles.deleteButton}>
                                <IconSymbol name="trash" size={20} color="#9CA3AF" />
                             </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText style={styles.sectionHeaderLabel}>MÉTODO DE ENTREGA</ThemedText>
            <View style={styles.segmentedControl}>
                <TouchableOpacity 
                    style={[styles.segment, deliveryMethod === 'pickup' && styles.segmentActive]} 
                    onPress={() => setDeliveryMethod('pickup')}
                >
                    <ThemedText style={[styles.segmentText, deliveryMethod === 'pickup' && styles.segmentTextActive]}>Recogida (Gratis)</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.segment, deliveryMethod === 'delivery' && styles.segmentActive]} 
                    onPress={() => setDeliveryMethod('delivery')}
                >
                    <ThemedText style={[styles.segmentText, deliveryMethod === 'delivery' && styles.segmentTextActive]}>Envío ({RIDER_PRICE.toFixed(2).replace('.', ',')}€)</ThemedText>
                </TouchableOpacity>
            </View>

            {/* Delivery Address Selector (Only if delivery is selected) */}
            {deliveryMethod === 'delivery' && (
                  <TouchableOpacity 
                    style={styles.addressSelector}
                    onPress={handleOpenAddressSheet}
                    activeOpacity={0.7}
                  >
                      <View style={styles.addressIcon}>
                          <IconSymbol name="location.fill" size={20} color="#5A228B" />
                      </View>
                      <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 14, color: '#6B7280', marginBottom: 2 }}>Dirección de entrega</ThemedText>
                          <ThemedText style={{ fontSize: 15, fontWeight: '600', color: '#11181C' }}>
                              {deliveryAddress?.address || 'Seleccionar dirección...'}
                          </ThemedText>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
              )}
          </View>

          {/* Breakdown */}
          <View style={styles.section}>
              <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownLabel}>Subtotal</ThemedText>
                  <ThemedText style={styles.breakdownValue}>{subtotal.toFixed(2)}€</ThemedText>
              </View>
              
              {savings > 0 && (
                <View style={styles.breakdownRow}>
                    <ThemedText style={styles.breakdownLabel}>Ahorro Surplus</ThemedText>
                    <View style={styles.savingsBadge}>
                        <ThemedText style={styles.savingsText}>-{savings.toFixed(2)}€</ThemedText>
                    </View>
                </View>
              )}

              <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownLabel}>Tarifa de entrega</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                      {deliveryMethod === 'delivery' ? `${RIDER_PRICE.toFixed(2)}€` : 'Gratis'}
                  </ThemedText>
              </View>

              {/* Service Fee (Hidden in image but good to keep for correctness, maybe implicit?) */}
               <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownLabel}>Gastos de gestión</ThemedText>
                  <ThemedText style={styles.breakdownValue}>{serviceFee?.toFixed(2) ?? '0.00'}€</ThemedText>
              </View>

              <View style={styles.dashedSeparator} />

              <View style={[styles.breakdownRow, { marginTop: 16 }]}>
                  <ThemedText type="defaultSemiBold" style={styles.totalLabel}>Total</ThemedText>
                  <ThemedText type="title" style={styles.totalValue}>{totalPrice}€</ThemedText>
              </View>
          </View>
        </ScrollView>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: (processing || serviceFee === null) ? '#9CA3AF' : '#111111' }]}
            onPress={handlePayment}
            disabled={processing || serviceFee === null}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
                <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20}}>
                    <ThemedText style={styles.primaryButtonText}>Continuar al pago</ThemedText>
                    <ThemedText style={styles.primaryButtonText}>{totalPrice}€</ThemedText>
                </View>
            )}
          </TouchableOpacity>
          <ThemedText style={styles.footerNote}>
              Al completar el pedido, aceptas nuestras condiciones de servicio y política de desperdicio cero.
          </ThemedText>
        </View>

        <DeliveryModeBottomSheet
            ref={bottomSheetRef}
            selectedMode={deliveryAddress?.mode || 'Ubicación actual'}
            onSelect={handleAddressSelect}
            onClose={() => bottomSheetRef.current?.close()}
            allowedModes={['Ubicación actual', 'Dirección personalizada', 'Mapa', 'Dirección guardada']}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Success View
  successContainer: { flex: 1, backgroundColor: '#fff', padding: 24 },
  successIconContainer: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center', color: '#11181C' },
  successSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  separator: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 24 },
  
  // Section Headers
  section: { gap: 12 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#11181C', marginBottom: 8 },

  // Product Card
  productSection: { marginTop: 10 },
  productCard: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  productInfo: { flex: 1, gap: 4 },
  productTitle: { fontSize: 16, lineHeight: 20, color: '#11181C' },
  partnerName: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  productPrice: { fontSize: 16, fontWeight: '600', color: '#11181C' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 4 },
  quantityButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  quantityText: { width: 32, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  deleteButton: { padding: 8 },

  sectionHeaderLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Segmented Control
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 12 },
  segment: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  segmentTextActive: { color: '#11181C', fontWeight: '600' },

  addressSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      gap: 12,
  },
  addressIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
  },

  // Breakdown
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breakdownLabel: { fontSize: 15, color: '#6B7280' },
  breakdownValue: { fontSize: 15, fontWeight: '500', color: '#11181C' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#11181C' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#11181C' },
  
  savingsBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  savingsText: { color: '#166534', fontSize: 13, fontWeight: '600' },

  dashedSeparator: { height: 1, borderTopWidth: 1, borderTopColor: '#E5E7EB', borderStyle: 'dashed', marginTop: 12 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  primaryButton: { width: '100%', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footerNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
