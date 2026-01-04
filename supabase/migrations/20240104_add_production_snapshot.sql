-- Add production_snapshot column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS production_snapshot JSONB DEFAULT NULL;
