-- Create table for Locals (Stores)
CREATE TABLE IF NOT EXISTS public.locales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    address TEXT,
    image_url TEXT
);

-- Enable Row Level Security (RLS) on locales
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to locales
CREATE POLICY "Enable read access for all users" ON public.locales
    FOR SELECT USING (true);


-- Create table for Offers
CREATE TABLE IF NOT EXISTS public.ofertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    end_time TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) on ofertas
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to ofertas
CREATE POLICY "Enable read access for all users" ON public.ofertas
    FOR SELECT USING (true);


-- Seed data for Locales
INSERT INTO public.locales (id, name, address, image_url) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Burger King', 'Calle Gran Vía 12', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Sushi Shop', 'Av. Diagonal 45', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Pizza Hut', 'Carrer de Sants 100', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Seed data for Offers
-- Offer 1: Ends in 2 hours (Should appear in "Terminan pronto")
INSERT INTO public.ofertas (title, description, price, original_price, end_time, image_url, local_id)
VALUES (
    'Whopper Menu',
    'Delicious Whopper with fries and drink.',
    5.99,
    8.50,
    NOW() + INTERVAL '2 hours',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Offer 2: Ends in 20 hours (Should appear in "Terminan pronto")
INSERT INTO public.ofertas (title, description, price, original_price, end_time, image_url, local_id)
VALUES (
    'Sushi Set 12pcs',
    'Assorted sushi set for lunch.',
    12.50,
    18.00,
    NOW() + INTERVAL '20 hours',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
);

-- Offer 3: Ends in 2 days (Should NOT appear in "Terminan pronto")
INSERT INTO public.ofertas (title, description, price, original_price, end_time, image_url, local_id)
VALUES (
    'Family Pizza Deal',
    '2 Large pizzas with 2 drinks.',
    22.00,
    30.00,
    NOW() + INTERVAL '2 days',
    'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&q=80',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- Offer 4: Ends in 5 hours (Should appear in "Terminan pronto")
INSERT INTO public.ofertas (title, description, price, original_price, end_time, image_url, local_id)
VALUES (
    'Chicken Nuggets 20pcs',
    'Crispy chicken nuggets to share.',
    4.99,
    9.99,
    NOW() + INTERVAL '5 hours',
    'https://images.unsplash.com/photo-1562967960-f55499638551?w=800&q=80',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);
