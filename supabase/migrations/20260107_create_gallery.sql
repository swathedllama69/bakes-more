-- Create gallery_items table
CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instagram_url TEXT NOT NULL UNIQUE,
    image_url TEXT,
    caption TEXT,
    thumbnail_url TEXT,
    media_type TEXT DEFAULT 'IMAGE',
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to gallery" ON gallery_items
    FOR SELECT USING (true);

-- Allow authenticated users to manage gallery
CREATE POLICY "Allow authenticated users to manage gallery" ON gallery_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Create index for ordering
CREATE INDEX gallery_items_order_idx ON gallery_items(display_order DESC, created_at DESC);
