create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  offer_id uuid references public.ofertas not null,
  local_id uuid references public.locales not null,
  price numeric not null,
  commission numeric not null,
  total numeric not null,
  customer_notes text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);
