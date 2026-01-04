-- Add account details to settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS account_details text DEFAULT '';

-- Add amount_paid to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
