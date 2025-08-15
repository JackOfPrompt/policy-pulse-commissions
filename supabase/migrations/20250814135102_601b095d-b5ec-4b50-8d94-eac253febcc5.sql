-- Create master_product_category table
CREATE TABLE public.master_product_category (
  category_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_code text NOT NULL UNIQUE,
  category_name text NOT NULL UNIQUE,
  category_desc text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create product_subcategory table
CREATE TABLE public.product_subcategory (
  subcategory_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.master_product_category(category_id),
  subcategory_code text NOT NULL UNIQUE,
  subcategory_name text NOT NULL,
  subcategory_desc text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category_id, subcategory_name)
);

-- Enable RLS
ALTER TABLE public.master_product_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subcategory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_product_category
CREATE POLICY "Allow authenticated users to read product categories" 
ON public.master_product_category 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage product categories" 
ON public.master_product_category 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);

-- Create RLS policies for product_subcategory
CREATE POLICY "Allow authenticated users to read product subcategories" 
ON public.product_subcategory 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage product subcategories" 
ON public.product_subcategory 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_master_product_category_updated_at
BEFORE UPDATE ON public.master_product_category
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_subcategory_updated_at
BEFORE UPDATE ON public.product_subcategory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for master_product_category
INSERT INTO public.master_product_category (category_code, category_name, category_desc) VALUES
('HEALTH_INDIV', 'Individual Health Plan', 'Coverage for a single individual'),
('HEALTH_FAM', 'Family Floater Plan', 'Coverage for family under one sum insured'),
('HEALTH_SC', 'Senior Citizen Plan', 'Designed for senior citizens'),
('HEALTH_TOPUP', 'Top-up Plan', 'Extra coverage over base policy');

-- Insert sample data for product_subcategory
INSERT INTO public.product_subcategory (category_id, subcategory_code, subcategory_name, subcategory_desc) 
SELECT 
  (SELECT category_id FROM public.master_product_category WHERE category_code = 'HEALTH_INDIV'),
  'RETAIL_IND',
  'Retail Individual',
  'Sold to individual customers'
UNION ALL
SELECT 
  (SELECT category_id FROM public.master_product_category WHERE category_code = 'HEALTH_INDIV'),
  'GROUP_IND',
  'Group Individual',
  'Offered via corporate groups'
UNION ALL
SELECT 
  (SELECT category_id FROM public.master_product_category WHERE category_code = 'HEALTH_FAM'),
  'RETAIL_FAM',
  'Retail Family Floater',
  'Sold to family customers'
UNION ALL
SELECT 
  (SELECT category_id FROM public.master_product_category WHERE category_code = 'HEALTH_SC'),
  'GOVT_SC',
  'Govt Senior Citizen',
  'Government-backed senior citizen health plan'
UNION ALL
SELECT 
  (SELECT category_id FROM public.master_product_category WHERE category_code = 'HEALTH_TOPUP'),
  'RETAIL_TOP',
  'Retail Top-up',
  'Extra retail coverage';