-- Create the favorites table
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  offer_id uuid references public.ofertas not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, offer_id)
);

-- Enable Row Level Security
alter table favorites enable row level security;

-- Create policies
create policy "Users can view their own favorites"
  on favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on favorites for delete
  using (auth.uid() = user_id);
