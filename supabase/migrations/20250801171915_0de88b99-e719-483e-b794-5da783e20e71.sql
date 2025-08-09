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

-- Create master_data_file_uploads table to track uploads
CREATE TABLE IF NOT EXISTS public.master_data_file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'cities', 'addons', 'benefits', etc.
  upload_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_details JSONB,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the uploads table
ALTER TABLE public.master_data_file_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for file uploads table
CREATE POLICY "Admin can manage file uploads" 
ON public.master_data_file_uploads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can view their uploads" 
ON public.master_data_file_uploads 
FOR SELECT 
USING (uploaded_by = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_master_data_file_uploads_updated_at
  BEFORE UPDATE ON public.master_data_file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_master_data_file_uploads_updated_at();