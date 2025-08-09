-- Remove provider_type field from insurance_providers table
ALTER TABLE public.insurance_providers 
DROP COLUMN IF EXISTS provider_type;

-- Add logo_file_path column to replace logo_url for file uploads
ALTER TABLE public.insurance_providers 
ADD COLUMN IF NOT EXISTS logo_file_path TEXT;