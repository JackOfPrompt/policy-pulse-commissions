-- Create RLS policies for provider_logos bucket uploads

-- Allow authenticated users to upload to provider_logos bucket
CREATE POLICY "Allow authenticated users to upload provider logos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'provider_logos');

-- Allow authenticated users to view provider logos (public bucket)
CREATE POLICY "Allow authenticated users to view provider logos" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'provider_logos');

-- Allow system admins to update provider logos
CREATE POLICY "Allow system admins to update provider logos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'provider_logos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'system_admin'
  )
);

-- Allow system admins to delete provider logos
CREATE POLICY "Allow system admins to delete provider logos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'provider_logos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'system_admin'
  )
);