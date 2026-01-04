-- Add VAT columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS vat numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_type text DEFAULT 'none'; -- 'none', 'inclusive', 'exclusive'
