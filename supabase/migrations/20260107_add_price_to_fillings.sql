-- Add price column to fillings table for pricing support
ALTER TABLE public.fillings ADD COLUMN price numeric;
