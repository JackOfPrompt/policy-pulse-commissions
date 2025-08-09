-- Make provider-documents bucket public for logo access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'provider-documents';

-- Create storage policies for provider documents
CREATE POLICY "Provider logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider-documents' AND (storage.foldername(name))[1] = 'logos');

-- Allow authenticated users to upload provider logos
CREATE POLICY "Authenticated users can upload provider logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'provider-documents' AND auth.role() = 'authenticated');

-- Allow authenticated users to update provider logos
CREATE POLICY "Authenticated users can update provider logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'provider-documents' AND auth.role() = 'authenticated');