# Stripe Connect Setup Guide

This guide details the steps to configure Stripe Connect for the application, enabling payments where the platform (Unbox) takes a commission (Application Fee) and transfers the remaining amount to the connected partner (Local).

## 1. Prerequisites

-   A Stripe Account (https://dashboard.stripe.com/register).
-   A Supabase Project (https://supabase.com/dashboard/project/new).
-   Node.js and Deno (for Supabase Edge Functions).

## 2. Stripe Dashboard Configuration

1.  **Enable Connect:**
    -   Go to **Connect** in your Stripe Dashboard.
    -   Click **Get started with Connect**.
    -   Choose **Platform** or **Marketplace** (Platform is typical for this use case).
    -   Complete the onboarding steps.

2.  **Create API Keys:**
    -   Go to **Developers > API keys**.
    -   Copy your **Publishable key** (`pk_test_...`).
    -   Copy your **Secret key** (`sk_test_...`).

3.  **Set Up Webhooks (Optional but Recommended):**
    -   Go to **Developers > Webhooks**.
    -   Add an endpoint for `payment_intent.succeeded` and `payment_intent.payment_failed`.
    -   Copy the **Signing secret** (`whsec_...`).

## 3. Environment Variables

Add the following keys to your `.env` (local) and Supabase Secrets (production):

**Frontend (.env):**
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Backend (Supabase Edge Function Secrets):**
Run these commands to set secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## 4. Supabase Edge Function: `create-payment-intent`

You must deploy a Supabase Edge Function to securely create PaymentIntents. The client (app) cannot do this directly because it requires the Secret Key.

**Steps:**

1.  Initialize the function:
    ```bash
    supabase functions new create-payment-intent
    ```

2.  Update `supabase/functions/create-payment-intent/index.ts` with the following code:

    ```typescript
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
    ```

3.  Deploy the function:
    ```bash
    supabase functions deploy create-payment-intent
    ```

## 5. Client-Side Integration

1.  **Install Dependencies:**
    ```bash
    npx expo install @stripe/stripe-react-native
    ```

2.  **Configure App Entry:**
    Wrap your root component (e.g., `app/_layout.tsx`) with `<StripeProvider>`:

    ```typescript
    import { StripeProvider } from '@stripe/stripe-react-native';

    export default function RootLayout() {
      return (
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
          {/* Your App Content */}
        </StripeProvider>
      );
    }
    ```

3.  **Implement Checkout Flow:**
    In your checkout screen (`app/checkout/[id].tsx`), call the Edge Function to get the `clientSecret`, initialize the Payment Sheet, and present it.

    ```typescript
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const fetchPaymentSheetParams = async () => {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: offer.price + APP_FEE,
          application_fee_amount: APP_FEE,
          local_stripe_account_id: offer.locales.stripe_account_id, // Must exist in DB
        },
      });
      if (!data || error) throw new Error('Could not fetch payment params');
      return { clientSecret: data.paymentIntent };
    };

    const initializePaymentSheet = async () => {
      const { clientSecret } = await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Unbox',
        returnURL: 'your-app-scheme://stripe-redirect', // Ensure linking is set up
      });
      if (!error) setLoading(false);
    };
    ```

## 6. Testing

-   Use Stripe Test Cards (e.g., `4242 4242 4242 4242`).
-   Verify in Stripe Dashboard > Connect > Transfers that the funds were split correctly (Platform fee vs. Connected account transfer).
