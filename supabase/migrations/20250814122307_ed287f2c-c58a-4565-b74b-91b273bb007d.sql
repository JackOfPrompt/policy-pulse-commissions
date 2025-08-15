-- Clean up duplicate and conflicting policies for lob_icons bucket
DROP POLICY IF EXISTS "Allow authenticated users to delete LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "LOB icons are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "System admins can delete LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "System admins can update LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "System admins can upload LOB icons" ON storage.objects;

-- Create simple policies that work for authenticated users
CREATE POLICY "Enable upload for authenticated users on lob_icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lob_icons' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Enable read for all on lob_icons" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lob_icons');

CREATE POLICY "Enable update for authenticated users on lob_icons" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'lob_icons' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Enable delete for authenticated users on lob_icons" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lob_icons' 
  AND auth.uid() IS NOT NULL
);