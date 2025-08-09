-- Update insurance_providers table
ALTER TABLE public.insurance_providers 
ADD COLUMN IF NOT EXISTS head_office_address text,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Update line_of_business table  
ALTER TABLE public.line_of_business
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create ProviderLOB mapping table
CREATE TABLE IF NOT EXISTS public.provider_line_of_business (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_provider_id uuid NOT NULL,
  line_of_business_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  remarks text,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_till date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  FOREIGN KEY (insurance_provider_id) REFERENCES public.insurance_providers(id) ON DELETE CASCADE,
  FOREIGN KEY (line_of_business_id) REFERENCES public.line_of_business(id) ON DELETE CASCADE,
  
  UNIQUE(insurance_provider_id, line_of_business_id)
);

-- Enable RLS on new table
ALTER TABLE public.provider_line_of_business ENABLE ROW LEVEL SECURITY;

-- Create enum for vehicle categories
DO $$ BEGIN
  CREATE TYPE vehicle_category_enum AS ENUM ('2W', 'Car', 'Commercial', 'Miscellaneous');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for premium frequency
DO $$ BEGIN
  CREATE TYPE premium_frequency_enum AS ENUM ('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update insurance_products table
ALTER TABLE public.insurance_products
ADD COLUMN IF NOT EXISTS product_type text,
ADD COLUMN IF NOT EXISTS premium_frequency_options premium_frequency_enum[] DEFAULT ARRAY['Yearly'::premium_frequency_enum],
ADD COLUMN IF NOT EXISTS vehicle_category vehicle_category_enum,
ADD COLUMN IF NOT EXISTS sum_insured_min_limit numeric,
ADD COLUMN IF NOT EXISTS sum_insured_max_limit numeric,
ADD COLUMN IF NOT EXISTS age_limit integer;

-- Add trigger for updated_at on new table
CREATE TRIGGER update_provider_line_of_business_updated_at
  BEFORE UPDATE ON public.provider_line_of_business
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();