-- Drop the existing policy and recreate with correct syntax
DROP POLICY IF EXISTS "Enable upload for authenticated users on lob_icons" ON storage.objects;

-- Create a simplified policy that allows any authenticated user to upload
CREATE POLICY "Allow authenticated uploads to lob_icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lob_icons'
);