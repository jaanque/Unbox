-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon_slug TEXT NOT NULL,
    hex_color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'categories'
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.categories
            FOR SELECT USING (true);
    END IF;
END $$;

-- Add category_id to ofertas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ofertas' AND column_name = 'category_id') THEN
        ALTER TABLE public.ofertas ADD COLUMN category_id UUID REFERENCES public.categories(id);
    END IF;
END $$;

-- Insert categories if they don't exist (using name as unique check roughly)
INSERT INTO public.categories (name, icon_slug, hex_color)
SELECT 'Comidas', 'bag.fill', '#E3F2FD'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Comidas');

INSERT INTO public.categories (name, icon_slug, hex_color)
SELECT 'Panadería', 'carrot.fill', '#FFF3E0'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Panadería');

INSERT INTO public.categories (name, icon_slug, hex_color)
SELECT 'Super', 'cart.fill', '#E8F5E9'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Super');

INSERT INTO public.categories (name, icon_slug, hex_color)
SELECT 'Postres', 'birthday.cake.fill', '#FCE4EC'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Postres');

INSERT INTO public.categories (name, icon_slug, hex_color)
SELECT 'Bebidas', 'cup.and.saucer.fill', '#EFEBE9'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Bebidas');

-- Update offers to have a category (randomly assigned)
UPDATE public.ofertas
SET category_id = (SELECT id FROM public.categories ORDER BY random() LIMIT 1)
WHERE category_id IS NULL;
