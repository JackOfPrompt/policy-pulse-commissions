-- Fix RLS policies for master_cities to allow INSERT operations
DROP POLICY IF EXISTS "All can view master cities" ON public.master_cities;
DROP POLICY IF EXISTS "Admin can manage master cities" ON public.master_cities;

-- Create proper RLS policies for master_cities
CREATE POLICY "Anyone can view active master cities" 
ON public.master_cities 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage master cities" 
ON public.master_cities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Allow authenticated users to insert cities data (for file processing)
CREATE POLICY "Authenticated users can insert master cities" 
ON public.master_cities 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure master-data-files bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'master-data-files', 
  'master-data-files', 
  true, 
  52428800, -- 50MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[]
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[];

-- Create storage policies for master-data-files bucket
DROP POLICY IF EXISTS "Anyone can view master data files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload master data files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage master data files" ON storage.objects;

CREATE POLICY "Anyone can view master data files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'master-data-files');

CREATE POLICY "Authenticated users can upload master data files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'master-data-files' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admin can manage master data files" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'master-data-files' 
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);