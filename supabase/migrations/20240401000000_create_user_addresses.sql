create table if not exists user_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

alter table user_addresses enable row level security;

create policy "Users can select their own addresses"
  on user_addresses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own addresses"
  on user_addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own addresses"
  on user_addresses for delete
  using (auth.uid() = user_id);
