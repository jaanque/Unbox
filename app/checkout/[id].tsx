import { DeliveryModeBottomSheet, DeliverySelection } from '@/components/DeliveryModeBottomSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons'; // <-- Importación añadida
import BottomSheet from '@gorhom/bottom-sheet';
import { useStripe } from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  ZoomIn
} from 'react-native-reanimated';
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

const layoutTransition = LinearTransition.duration(250);
const MAX_QUANTITY = 10;
const MIN_QUANTITY = 1;

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const offerId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliverySelection | null>(null);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [riderPrice, setRiderPrice] = useState<number>(2.50);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);

  useEffect(() => {
    if (!offerId) {
      router.back();
      return;
    }
    Promise.all([fetchSettings(), fetchOfferDetails()]).finally(() => {
      setLoading(false);
    });
  }, [offerId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['service_fee', 'rider_price']);
      if (error) throw error;
      if (data) {
        data.forEach(setting => {
          if (setting.key === 'service_fee') setServiceFee(parseFloat(setting.value));
          if (setting.key === 'rider_price') setRiderPrice(parseFloat(setting.value));
        });
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  const fetchOfferDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('ofertas')
        .select(`id, title, price, original_price, image_url, local_id, locales (name, stripe_account_id)`)
        .eq('id', offerId)
        .single();
      if (error) throw error;
      const formattedData = {
        ...data,
        locales: Array.isArray(data.locales) ? data.locales[0] : data.locales
      } as unknown as OfferDetail;
      setOffer(formattedData);
    } catch (e) {
      console.error('Error fetching offer details:', e);
      Alert.alert('Error', 'No se pudo cargar la oferta.');
      router.back();
    }
  };

  const subtotal = useMemo(() => offer ? (offer.original_price || offer.price) * quantity : 0, [offer, quantity]);
  const savings = useMemo(() => offer && offer.original_price ? (offer.original_price - offer.price) * quantity : 0, [offer, quantity]);
  const shippingCost = useMemo(() => deliveryMethod === 'delivery' ? riderPrice : 0, [deliveryMethod, riderPrice]);
  const totalAmountUI = useMemo(() => offer ? (offer.price * quantity) + serviceFee + shippingCost : 0, [offer, quantity, serviceFee, shippingCost]);

  const handleQuantityChange = (type: 'increment' | 'decrement') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(prev => {
      if (type === 'increment') return Math.min(prev + 1, MAX_QUANTITY);
      return Math.max(prev - 1, MIN_QUANTITY);
    });
  };

  const removeItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Eliminar producto', '¿Estás seguro de que quieres eliminar este producto del carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          router.back();
      }}
    ]);
  };

  const handlePayment = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!offer) return;
    
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return Alert.alert('Falta dirección', 'Por favor, selecciona una dirección de entrega.');
    }
    
    setProcessing(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setProcessing(false);
        return router.push('/login');
      }

      // El backend calcula el precio real por seguridad
      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: { offer_id: offer.id, quantity, delivery_method: deliveryMethod, delivery_address: deliveryAddress },
      });

      // Validamos si la función de Edge devolvió error o no trajo el intent
      if (functionError) {
        console.error('Error de Supabase Function:', functionError);
        throw new Error(functionError.message || 'Error del servidor al calcular el pago.');
      }
      
      if (!data?.paymentIntent) {
        console.error('Data recibida sin paymentIntent:', data);
        throw new Error('El servidor no devolvió el identificador de Stripe.');
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Unbox",
        paymentIntentClientSecret: data.paymentIntent,
        returnURL: 'unbox://stripe-redirect',
        defaultBillingDetails: { name: user.user_metadata?.name || 'Cliente' }
      });
      
      if (initError) {
        console.error('Error iniciando PaymentSheet:', initError);
        throw new Error(initError.message);
      }

      const { error: paymentError } = await presentPaymentSheet();
      
      if (paymentError) {
        // Si el usuario simplemente canceló/cerró el modal de pago, no disparamos alerta de error
        if (paymentError.code === 'Canceled') {
          setProcessing(false);
          return;
        }
        console.error('Error presentando PaymentSheet:', paymentError);
        throw new Error(paymentError.message);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      
    } catch (e: any) {
      console.error('Catch general de pago:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error en el pago', e.message || 'Ocurrió un error al procesar el pago. Por favor, intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <ThemedView style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#333" />
    </ThemedView>
  );

  if (success) return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.successContainer}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.successIconContainer}>
          <IconSymbol name="checkmark" size={48} color="#333" />
        </Animated.View>
        <ThemedText type="title" style={styles.successTitle}>¡Pedido confirmado!</ThemedText>
        <ThemedText style={styles.successSubtitle}>Gracias por tu compra. Puedes ver los detalles en tu perfil.</ThemedText>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.navigate('/(tabs)')}>
          <ThemedText style={styles.primaryButtonText}>Volver a inicio</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Tu Carrito', headerTitleAlign: 'center', headerTintColor: '#000', 
        headerShadowVisible: false, headerStyle: { backgroundColor: '#f8f6f6' },
        headerBackVisible: false, 
        headerLeft: () => (       
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <IconSymbol name="chevron.left" size={24} color="#000" />
            <ThemedText style={styles.headerBackText}>Atrás</ThemedText>
          </TouchableOpacity>
        )
      }} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {offer && (
            <Animated.View layout={layoutTransition} style={styles.productSection}>
                <View style={styles.productCard}>
                    <Image source={{ uri: offer.image_url }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                        <View style={styles.productHeader}>
                            <ThemedText numberOfLines={2} style={styles.productTitle}>{offer.title}</ThemedText>
                            <ThemedText style={styles.productPrice}>{((offer.original_price || offer.price) * quantity).toFixed(2)}€</ThemedText>
                        </View>
                        <ThemedText style={styles.partnerName}>{offer.locales?.name}</ThemedText>
                        <View style={styles.actionRow}>
                             <View style={styles.quantitySelector}>
                                <TouchableOpacity onPress={() => handleQuantityChange('decrement')} style={styles.quantityButton}>
                                    {/* Cambiado a MaterialIcons */}
                                    <MaterialIcons name="remove" size={16} color="#333" />
                                </TouchableOpacity>
                                <Animated.Text layout={layoutTransition} style={styles.quantityText}>{quantity}</Animated.Text>
                                <TouchableOpacity onPress={() => handleQuantityChange('increment')} style={styles.quantityButton}>
                                    {/* Cambiado a MaterialIcons */}
                                    <MaterialIcons name="add" size={16} color="#333" />
                                </TouchableOpacity>
                             </View>
                             <TouchableOpacity onPress={removeItem} style={styles.deleteButton}>
                                {/* Cambiado a MaterialIcons por si 'trash' también falla */}
                                <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                             </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
          )}

          <Animated.View layout={layoutTransition} style={styles.section}>
            <ThemedText style={styles.sectionHeaderLabel}>MÉTODO DE ENTREGA</ThemedText>
            <View style={styles.segmentedControl}>
                <TouchableOpacity style={[styles.segment, deliveryMethod === 'pickup' && styles.segmentActive]} onPress={() => setDeliveryMethod('pickup')}>
                    <ThemedText style={[styles.segmentText, deliveryMethod === 'pickup' && styles.segmentTextActive]}>Recogida (Gratis)</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segment, deliveryMethod === 'delivery' && styles.segmentActive]} onPress={() => setDeliveryMethod('delivery')}>
                    <ThemedText style={[styles.segmentText, deliveryMethod === 'delivery' && styles.segmentTextActive]}>Envío ({riderPrice.toFixed(2)}€)</ThemedText>
                </TouchableOpacity>
            </View>

            {deliveryMethod === 'delivery' && (
              <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutUp.duration(150)} layout={layoutTransition}>
                <TouchableOpacity style={styles.cardContainer} onPress={() => bottomSheetRef.current?.expand()}>
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}><IconSymbol name="location.fill" size={20} color="#333" /></View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.addressLabel}>Dirección de entrega</ThemedText>
                            <ThemedText style={styles.addressValue} numberOfLines={1}>{deliveryAddress?.address || 'Seleccionar dirección...'}</ThemedText>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
                    </View>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View layout={layoutTransition} style={styles.section}>
              <ThemedText style={styles.sectionHeaderLabel}>RESUMEN DEL PEDIDO</ThemedText>
              <View style={styles.cardContainer}>
                <View style={styles.breakdownRow}>
                    <ThemedText style={styles.breakdownLabel}>Subtotal</ThemedText>
                    <ThemedText style={styles.breakdownValue}>{subtotal.toFixed(2)}€</ThemedText>
                </View>
                {savings > 0 && (
                  <Animated.View entering={FadeInDown.duration(200)} layout={layoutTransition} style={styles.breakdownRow}>
                      <ThemedText style={styles.breakdownLabel}>Ahorro Surplus</ThemedText>
                      <View style={styles.savingsBadge}><ThemedText style={styles.savingsText}>-{savings.toFixed(2)}€</ThemedText></View>
                  </Animated.View>
                )}
                <View style={styles.breakdownRow}>
                    <ThemedText style={styles.breakdownLabel}>Tarifa de entrega</ThemedText>
                    <ThemedText style={styles.breakdownValue}>{deliveryMethod === 'delivery' ? `${riderPrice.toFixed(2)}€` : 'Gratis'}</ThemedText>
                </View>
                <View style={styles.breakdownRow}>
                    <ThemedText style={styles.breakdownLabel}>Gastos de gestión</ThemedText>
                    <ThemedText style={styles.breakdownValue}>{serviceFee.toFixed(2)}€</ThemedText>
                </View>
                <View style={styles.totalRow}>
                    <ThemedText style={styles.totalLabel}>Total</ThemedText>
                    <ThemedText style={styles.totalValue}>{totalAmountUI.toFixed(2)}€</ThemedText>
                </View>
              </View>
          </Animated.View>
        </ScrollView>

        <Animated.View layout={layoutTransition} style={styles.footer}>
          <TouchableOpacity style={[styles.primaryButton, processing && { backgroundColor: '#9CA3AF' }]} onPress={handlePayment} disabled={processing}>
            {processing ? <ActivityIndicator color="#fff" /> : (
                <View style={styles.buttonContent}>
                    <ThemedText style={styles.primaryButtonText}>Continuar al pago</ThemedText>
                    <ThemedText style={styles.primaryButtonText}>{totalAmountUI.toFixed(2)}€</ThemedText>
                </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <DeliveryModeBottomSheet ref={bottomSheetRef} selectedMode={deliveryAddress?.mode || 'Ubicación actual'} onSelect={setDeliveryAddress} onClose={() => bottomSheetRef.current?.close()} allowedModes={['Ubicación actual', 'Dirección personalizada', 'Mapa', 'Dirección guardada']} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6f6' },
  headerBackButton: { flexDirection: 'row', alignItems: 'center', marginLeft: -8, padding: 8 },
  headerBackText: { fontSize: 17, color: '#000', marginLeft: 2, fontWeight: '500' },
  successContainer: { flex: 1, backgroundColor: '#f8f6f6', padding: 24 },
  successIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  successTitle: { fontSize: 28, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  successSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130 }, 
  section: { marginBottom: 20 },
  sectionHeaderLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' },
  productSection: { marginBottom: 20 },
  productCard: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f8f6f6' },
  productInfo: { flex: 1, gap: 4 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productTitle: { fontSize: 16, fontWeight: '700', color: '#11181C', flex: 1, marginRight: 8 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  partnerName: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f6f6', borderRadius: 10, padding: 4 },
  quantityButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  quantityText: { width: 32, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#11181C' },
  deleteButton: { padding: 8 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 12 },
  segment: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  segmentTextActive: { color: '#11181C', fontWeight: '700' },
  cardContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f8f6f6', justifyContent: 'center', alignItems: 'center' },
  addressLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  addressValue: { fontSize: 14, fontWeight: '700', color: '#11181C' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breakdownLabel: { fontSize: 14, color: '#6B7280' },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: '#11181C' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#11181C' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#11181C' },
  savingsBadge: { backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  savingsText: { color: '#333', fontSize: 12, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 16 },
  primaryButton: { width: '100%', height: 56, borderRadius: 14, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', shadowColor: '#333', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  buttonContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});