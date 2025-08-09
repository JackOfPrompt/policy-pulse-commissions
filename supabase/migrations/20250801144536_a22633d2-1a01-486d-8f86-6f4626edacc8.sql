-- Create storage bucket for master data files
INSERT INTO storage.buckets (id, name, public)
VALUES ('master-data-files', 'master-data-files', true);

-- Create storage policies for master data files
CREATE POLICY "Admin can upload master data files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'master-data-files' 
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admin can view master data files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'master-data-files' 
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admin can update master data files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'master-data-files' 
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admin can delete master data files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'master-data-files' 
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Create a table to track file uploads and processing status
CREATE TABLE public.master_data_file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  file_size BIGINT,
  upload_status TEXT NOT NULL DEFAULT 'uploaded',
  processing_status TEXT NOT NULL DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_details JSONB,
  uploaded_by UUID REFERENCES auth.users(id),
  processed_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on file uploads table
ALTER TABLE public.master_data_file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file uploads table
CREATE POLICY "Admin can manage file uploads" 
ON public.master_data_file_uploads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_master_data_file_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_master_data_file_uploads_updated_at
  BEFORE UPDATE ON public.master_data_file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_master_data_file_uploads_updated_at();