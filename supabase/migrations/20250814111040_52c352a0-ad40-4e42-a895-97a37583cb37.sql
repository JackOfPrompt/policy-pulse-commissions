-- Drop the existing RLS policies that require Supabase auth
DROP POLICY IF EXISTS "Allow authenticated users to upload provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow system admins to update provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow system admins to delete provider logos" ON storage.objects;

-- Create public access policies for provider_logos bucket that work with custom auth
-- Allow anyone to upload to provider_logos bucket (will be restricted by app logic)
CREATE POLICY "Allow public upload to provider logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'provider_logos');

-- Allow anyone to view provider logos (public bucket)
CREATE POLICY "Allow public access to provider logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider_logos');

-- Allow updates to provider logos
CREATE POLICY "Allow updates to provider logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'provider_logos');

-- Allow deletes for provider logos
CREATE POLICY "Allow deletes for provider logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'provider_logos');