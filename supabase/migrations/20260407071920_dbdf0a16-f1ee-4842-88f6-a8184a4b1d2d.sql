-- Create storage bucket for enhanced images
INSERT INTO storage.buckets (id, name, public)
VALUES ('enhanced-images', 'enhanced-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for enhanced images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'enhanced-images');

-- Allow anon upload for enhanced images (edge function uses service role anyway)
CREATE POLICY "Anon upload for enhanced images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'enhanced-images');