import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { amount, currency = 'eur', customer_id, local_stripe_account_id, application_fee_amount } = await req.json()

    // Validate inputs
    if (!amount || !local_stripe_account_id) {
        throw new Error('Missing amount or local_stripe_account_id')
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: { enabled: true },
      customer: customer_id, // Optional: if you save customers
      application_fee_amount: Math.round(application_fee_amount * 100), // Platform fee in cents
      transfer_data: {
        destination: local_stripe_account_id, // The partner's connected account ID
      },
    })

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: null, // Implement ephemeral key logic if saving cards
        customer: customer_id,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'), // Optional to return
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})