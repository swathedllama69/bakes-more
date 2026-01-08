-- Migration: Add dessert_id to order_items and cost to fillings
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS dessert_id uuid;

ALTER TABLE public.fillings
    ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;
