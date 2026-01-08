-- Migration: Update desserts table to match frontend expectations
ALTER TABLE public.desserts
    ADD COLUMN IF NOT EXISTS selling_price numeric DEFAULT 0;

-- Optional: If you want to remove the old 'price' column (after migrating data):
-- ALTER TABLE public.desserts DROP COLUMN IF EXISTS price;

-- Optional: Copy data from 'price' to 'selling_price' if needed
UPDATE public.desserts SET selling_price = price WHERE selling_price IS NULL OR selling_price = 0;
