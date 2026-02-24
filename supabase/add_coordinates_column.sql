-- Add coordinates columns to locales table
ALTER TABLE public.locales ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.locales ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Burger King (Madrid, Gran Vía 12)
UPDATE public.locales
SET latitude = 40.419992, longitude = -3.698018
WHERE name = 'Burger King';

-- Sushi Shop (Barcelona, Av. Diagonal 45)
UPDATE public.locales
SET latitude = 41.385063, longitude = 2.173404
WHERE name = 'Sushi Shop';

-- Pizza Hut (Barcelona, Carrer de Sants 100)
UPDATE public.locales
SET latitude = 41.375681, longitude = 2.137021
WHERE name = 'Pizza Hut';
