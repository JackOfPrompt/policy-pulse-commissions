-- The INSERT policy is missing for lob_icons. Let me add it back.
CREATE POLICY "Enable upload for authenticated users on lob_icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lob_icons' 
  AND auth.uid() IS NOT NULL
);