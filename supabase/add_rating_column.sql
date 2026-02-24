-- Add rating column to locales table
ALTER TABLE public.locales ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) DEFAULT 4.5;

-- Update existing locales with some sample ratings
UPDATE public.locales
SET rating = 4.2
WHERE name LIKE 'Burger King';

UPDATE public.locales
SET rating = 4.8
WHERE name LIKE 'Sushi Shop';

UPDATE public.locales
SET rating = 4.5
WHERE name LIKE 'Pizza Hut';
