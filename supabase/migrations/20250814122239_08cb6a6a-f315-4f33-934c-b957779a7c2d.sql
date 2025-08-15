-- Check existing storage policies and create proper RLS policies for lob_icons bucket

-- Create RLS policies for lob_icons storage bucket
CREATE POLICY "System admins can upload LOB icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lob_icons' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'system_admin'
  ))
);

CREATE POLICY "Anyone can view LOB icons" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lob_icons');

CREATE POLICY "System admins can update LOB icons" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'lob_icons' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'system_admin'
  ))
);

CREATE POLICY "System admins can delete LOB icons" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lob_icons' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'system_admin'
  ))
);