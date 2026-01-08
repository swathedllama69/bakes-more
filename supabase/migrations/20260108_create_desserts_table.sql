-- Migration: Create desserts table with correct columns
CREATE TABLE IF NOT EXISTS public.desserts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    selling_price numeric DEFAULT 0,
    cost numeric DEFAULT 0,
    ingredients jsonb DEFAULT '[]',
    yield_amount numeric,
    yield_unit text,
    baking_duration_minutes integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Optional: Add index for searching by name
CREATE INDEX IF NOT EXISTS desserts_name_idx ON public.desserts (name);
