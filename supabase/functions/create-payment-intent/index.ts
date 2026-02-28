import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Inicializar cliente Supabase con el token del usuario (para respetar RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Autenticación: Verificar quién hace la petición
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // 3. Recibir los datos de intención de compra (NO RECIBIMOS PRECIOS)
    const body = await req.json()
    const { offer_id, quantity, delivery_method, delivery_address, customer_notes, customer_id } = body

    if (!offer_id || !quantity || !delivery_method) {
        throw new Error('Faltan datos obligatorios del pedido')
    }

    // 4. Obtener Ajustes (Fees) de forma segura desde la BD
    const { data: settingsData } = await supabaseClient
      .from('settings')
      .select('key, value')
      .in('key', ['service_fee', 'rider_price'])
    
    let serviceFee = 0;
    let riderPrice = 2.50;
    settingsData?.forEach(s => {
      if (s.key === 'service_fee') serviceFee = parseFloat(s.value);
      if (s.key === 'rider_price') riderPrice = parseFloat(s.value);
    });

    // 5. Obtener la Oferta de forma segura desde la BD
    const { data: offer, error: offerError } = await supabaseClient
      .from('ofertas')
      .select(`id, price, local_id, locales (stripe_account_id)`)
      .eq('id', offer_id)
      .single()

    if (offerError || !offer) throw new Error('Oferta no encontrada')

    const stripeAccountId = Array.isArray(offer.locales) 
      ? offer.locales[0]?.stripe_account_id 
      : (offer.locales as any)?.stripe_account_id;

    if (!stripeAccountId) throw new Error('El local no tiene cuenta de Stripe configurada')

    // 6. CÁLCULO SEGURO EN EL SERVIDOR
    const commission = serviceFee;
    const shippingCost = delivery_method === 'delivery' ? riderPrice : 0;
    const totalAmount = (offer.price * quantity) + commission + shippingCost;

    // 7. Preparar parámetros para Stripe (en céntimos)
    const paymentIntentParams: any = {
      amount: Math.round(Number(totalAmount.toFixed(2)) * 100), 
      currency: 'eur',
      application_fee_amount: Math.round(Number(commission.toFixed(2)) * 100),
      automatic_payment_methods: { enabled: true },
      transfer_data: { destination: stripeAccountId },
      metadata: { offer_id, user_id: user.id } // Útil para auditoría en el Dashboard de Stripe
    }

    if (customer_id) paymentIntentParams.customer = customer_id;

    // 8. Crear el pago en Stripe
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    // 9. INSERTAR EL PEDIDO EN ESTADO PENDIENTE
    // Usamos el Service Role para garantizar que se inserta aunque el usuario tenga RLS restrictivo en inserciones
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: orderError } = await supabaseAdmin.from('orders').insert({
        user_id: user.id,
        offer_id: offer.id,
        local_id: offer.local_id,
        price: offer.price,
        quantity: quantity,
        commission: commission,
        total: totalAmount,
        customer_notes: customer_notes || '',
        status: 'pending', // ¡IMPORTANTE! Estado pendiente
        payment_intent_id: paymentIntent.id, 
        application_fee: commission,
        delivery_method: delivery_method,
        shipping_cost: shippingCost,
        delivery_address: delivery_address || null,
    })

    if (orderError) {
      console.error("Error guardando el pedido pendiente:", orderError)
      throw new Error("No se pudo registrar el pedido")
    }

    // 10. Devolver la respuesta a la app
    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        customer: customer_id,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '',
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )

  } catch (error: any) {
    console.error("ERROR FATAL AL CREAR PAGO:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})