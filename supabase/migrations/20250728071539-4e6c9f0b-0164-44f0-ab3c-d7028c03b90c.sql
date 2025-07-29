-- Create insurance providers table
CREATE TABLE public.insurance_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  irdai_code TEXT UNIQUE NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('General', 'Life', 'Health', 'Motor')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  contact_person TEXT,
  support_email TEXT,
  phone_number TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  api_key TEXT,
  api_endpoint TEXT,
  documents_folder TEXT, -- Store folder path for uploaded documents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage all insurance providers" ON public.insurance_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_insurance_providers_updated_at
  BEFORE UPDATE ON public.insurance_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-documents', 'provider-documents', false);

-- Create storage policies for provider documents
CREATE POLICY "Admins can upload provider documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view provider documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update provider documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete provider documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'));