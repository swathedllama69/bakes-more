-- 1. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    html TEXT,
    order_id UUID,
    status TEXT DEFAULT 'sent'
);

-- 2. Add RLS policies for email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to email_logs"
    ON public.email_logs FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public select from email_logs"
    ON public.email_logs FOR SELECT
    TO public
    USING (true);

-- 3. Add receipt_url to orders if not exists (already in schema? checking via tool but adding just in case)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- 4. Storage Bucket Setup (This usually needs to be done in Supabase UI, but SQL can sometimes init)
-- We'll assume the 'payment_proofs' bucket needs to be public.
-- If the bucket 'payment-proofs' doesn't exist, you should create it in the Supabase Dashboard > Storage.
