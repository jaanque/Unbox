import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Centralizamos el CORS para no olvidarnos de ninguna cabecera
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Petición OPTIONS (Preflight) para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("Datos recibidos desde la app:", body) // CHIVATO 1: Veremos qué manda la app realmente

    const { amount, currency = 'eur', customer_id, local_stripe_account_id, application_fee_amount } = body

    // 2. Validación de seguridad
    if (!amount || !local_stripe_account_id) {
        throw new Error('Falta el monto (amount) o el ID del comercio (local_stripe_account_id)')
    }

    // 3. Montar los datos para Stripe dinámicamente (solo enviamos lo que existe)
    // IMPORTANT: Ensure amount is treated as 2 decimals before converting to cents to avoid float errors
    // e.g. 19.99 * 100 = 1998.9999... -> Math.round() -> 1999
    // But safely: Number(amount).toFixed(2) -> "19.99" -> * 100 -> 1999
    const paymentIntentParams: any = {
      amount: Math.round(Number(Number(amount).toFixed(2)) * 100), 
      currency: currency,
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: local_stripe_account_id,
      },
    }

    // Si hay comisión de la app, se la añadimos
    if (application_fee_amount) {
        paymentIntentParams.application_fee_amount = Math.round(Number(Number(application_fee_amount).toFixed(2)) * 100)
    }

    // Si hay cliente guardado, se lo añadimos
    if (customer_id) {
        paymentIntentParams.customer = customer_id
    }

    console.log("Mandando a Stripe estos parámetros:", paymentIntentParams) // CHIVATO 2

    // 4. Ejecutar el cobro en Stripe
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)
    
    console.log("¡Éxito! Pago creado con ID:", paymentIntent.id) // CHIVATO 3

    // 5. Devolver la respuesta a la app de Expo
    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        customer: customer_id,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') ?? '',
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }, // CORS incluido
    )

  } catch (error: any) { // El "any" evita que TypeScript rompa Deno al leer error.message
    console.error("ERROR FATAL AL CREAR PAGO:", error) // CHIVATO 4: Esto saldrá en rojo en Supabase

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }, // CORS incluido en el error
    })
  }
})