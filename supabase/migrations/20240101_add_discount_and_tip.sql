-- Add discount column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;

-- Add tip column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tip numeric DEFAULT 0;
