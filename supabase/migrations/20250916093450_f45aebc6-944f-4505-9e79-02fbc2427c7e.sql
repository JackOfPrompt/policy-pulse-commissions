-- Create product_types table for policy categorization
CREATE TABLE IF NOT EXISTS public.product_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Reference tables are viewable by all authenticated users"
ON public.product_types
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage product types"
ON public.product_types  
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo 
    WHERE uo.user_id = auth.uid() 
    AND uo.role IN ('admin', 'superadmin')
  )
);

-- Insert common product types based on existing data
INSERT INTO public.product_types (name, category, code) VALUES
  ('Life Insurance', 'life', 'LIFE001'),
  ('Health Insurance', 'health', 'HLTH001'),
  ('Motor Insurance', 'motor', 'MOTO001'),
  ('Travel Insurance', 'travel', 'TRVL001'),
  ('Personal Accident', 'personal_accident', 'PA001'),
  ('Home Insurance', 'home', 'HOME001'),
  ('Business Insurance', 'business', 'BIZ001')
ON CONFLICT DO NOTHING;

-- Update policies with missing product_type_id to use life insurance as default
UPDATE policies SET product_type_id = (
  SELECT pt.id FROM product_types pt 
  WHERE pt.category = 'life'
  LIMIT 1
) WHERE product_type_id IS NULL;