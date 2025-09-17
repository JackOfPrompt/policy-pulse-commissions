-- Add org_id column to product_types table
ALTER TABLE public.product_types 
ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- Update existing product_types to use the first organization (for existing data)
UPDATE public.product_types 
SET org_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE org_id IS NULL;

-- Make org_id required for future inserts
ALTER TABLE public.product_types 
ALTER COLUMN org_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_types_org_id ON public.product_types(org_id);

-- Add unique constraint on org_id + code combination
ALTER TABLE public.product_types 
ADD CONSTRAINT unique_product_type_org_code UNIQUE (org_id, code);