-- Create RLS policies for lob_icons storage bucket
CREATE POLICY "Allow authenticated users to upload LOB icons"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'lob_icons' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view LOB icons"
ON storage.objects
FOR SELECT
USING (bucket_id = 'lob_icons');

CREATE POLICY "Allow authenticated users to update LOB icons"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'lob_icons' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'lob_icons' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete LOB icons"
ON storage.objects
FOR DELETE
USING (bucket_id = 'lob_icons' AND auth.role() = 'authenticated');