-- Add base_cost to recipes for caching calculated cost
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS base_cost NUMERIC DEFAULT 0;

-- Add instructions and category to recipes table
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Cake';

-- Add selling_price to recipes
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS selling_price NUMERIC DEFAULT 0;

-- Add yield and sizing info to recipes
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS yield_amount NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS yield_unit TEXT DEFAULT 'Unit',
ADD COLUMN IF NOT EXISTS base_size_inches NUMERIC DEFAULT NULL;
