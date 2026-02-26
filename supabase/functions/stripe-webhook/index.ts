import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text(); // Stripe necesita el texto crudo para verificar

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      cryptoProvider
    );

    // Aquí manejas si el pago ha ido bien
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('¡Pago exitoso!', paymentIntent.id);
      // TODO: Actualizar tu base de datos (marcar pedido como pagado)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Error de Webhook:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})