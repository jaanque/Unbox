/*
  Migration to add Stripe Connect support to locales and orders.

  1. Add stripe_account_id to locales table.
     - This stores the connected account ID (e.g., acct_123456789) for the partner.
     - We default to NULL as not all partners may have connected Stripe yet.

  2. Add payment fields to orders table.
     - payment_intent_id: Stores the Stripe PaymentIntent ID (e.g., pi_123456789).
     - stripe_fee: Stores the fee charged by Stripe (in cents or currency unit).
     - application_fee: Stores the platform fee (in cents or currency unit).
     - transfer_group: Stores the transfer group ID (e.g., order_123456789) for grouping transfers.
*/

alter table public.locales
add column if not exists stripe_account_id text;

alter table public.orders
add column if not exists payment_intent_id text,
add column if not exists stripe_fee numeric,
add column if not exists application_fee numeric,
add column if not exists transfer_group text;

/*
  Ensure RLS policies allow reading these fields where appropriate.
  - Users can read their own order details (already covered by existing policy).
  - Admins or service roles can read all fields (implicit).
*/
