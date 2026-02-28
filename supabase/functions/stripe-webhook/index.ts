import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Necesitamos el Admin Client para actualizar tablas restringidas por RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text(); 

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      cryptoProvider
    );

    const paymentIntent = event.data.object as any;

    // MÁXIMA SEGURIDAD: Actualizamos el pedido según lo que diga Stripe
    if (event.type === 'payment_intent.succeeded') {
      console.log(`Pago confirmado: ${paymentIntent.id}`);
      
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('payment_intent_id', paymentIntent.id);
        
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      console.log(`Pago fallido o cancelado: ${paymentIntent.id}`);
      
      await supabaseAdmin
        .from('orders')
        .update({ status: 'failed' })
        .eq('payment_intent_id', paymentIntent.id);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error('Error de Webhook:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})