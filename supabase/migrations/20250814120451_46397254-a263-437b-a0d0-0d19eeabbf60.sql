-- Check existing storage policies first and drop them if they exist
DROP POLICY IF EXISTS "Public read access for LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "System admins can update LOB icons" ON storage.objects;
DROP POLICY IF EXISTS "System admins can delete LOB icons" ON storage.objects;

-- Ensure LOB icons storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public) VALUES ('lob_icons', 'lob_icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create storage policies for LOB icons
CREATE POLICY "Public read access for LOB icons" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lob_icons');

CREATE POLICY "Authenticated users can upload LOB icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'lob_icons' AND auth.uid() IS NOT NULL);

CREATE POLICY "System admins can update LOB icons" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'lob_icons' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'
));

CREATE POLICY "System admins can delete LOB icons" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'lob_icons' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'
));