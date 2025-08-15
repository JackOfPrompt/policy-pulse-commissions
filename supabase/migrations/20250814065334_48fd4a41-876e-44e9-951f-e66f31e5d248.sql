-- Create storage bucket for provider logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider_logos',
  'provider_logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for provider_logos bucket
CREATE POLICY "Provider logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider_logos');

CREATE POLICY "Authenticated users can upload provider logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'provider_logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update provider logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'provider_logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete provider logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'provider_logos' AND auth.role() = 'authenticated');