-- Add stock column to ofertas table
ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 5;

-- Update existing offers with some sample stock
UPDATE public.ofertas
SET stock = floor(random() * 8 + 1)::int;
