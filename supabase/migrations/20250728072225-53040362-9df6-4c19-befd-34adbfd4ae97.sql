-- Create insurance products table
CREATE TABLE public.insurance_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.insurance_providers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Health', 'Life', 'Motor', 'Travel', 'Property', 'Personal Accident')),
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('Individual', 'Family Floater')),
  min_sum_insured DECIMAL(15,2) NOT NULL,
  max_sum_insured DECIMAL(15,2) NOT NULL,
  premium_type TEXT NOT NULL CHECK (premium_type IN ('Fixed', 'Slab', 'Age-based')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Discontinued')),
  description TEXT,
  api_mapping_key TEXT,
  features TEXT[], -- Array of feature tags
  brochure_file_path TEXT, -- Store file path for brochure
  eligibility_criteria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, code) -- Code must be unique per provider
);

-- Enable Row Level Security
ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage all insurance products" ON public.insurance_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_insurance_products_updated_at
  BEFORE UPDATE ON public.insurance_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product brochures
INSERT INTO storage.buckets (id, name, public) VALUES ('product-brochures', 'product-brochures', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product brochures
CREATE POLICY "Admins can upload product brochures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-brochures' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view product brochures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-brochures' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product brochures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-brochures' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product brochures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-brochures' AND public.has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX idx_insurance_products_provider_id ON public.insurance_products(provider_id);
CREATE INDEX idx_insurance_products_category ON public.insurance_products(category);
CREATE INDEX idx_insurance_products_status ON public.insurance_products(status);