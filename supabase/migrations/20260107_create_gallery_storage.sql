-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete gallery images" ON storage.objects;

-- Allow public read access to gallery images
CREATE POLICY "Allow public read access to gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-images');

-- Allow authenticated users to upload gallery images
CREATE POLICY "Allow authenticated users to upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'gallery-images'
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete gallery images
CREATE POLICY "Allow authenticated users to delete gallery images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'gallery-images'
    AND auth.role() = 'authenticated'
);
