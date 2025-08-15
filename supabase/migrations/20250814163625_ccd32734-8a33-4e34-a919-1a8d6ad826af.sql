-- Create master_product_name table
CREATE TABLE public.master_product_name (
  product_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lob_id uuid NOT NULL REFERENCES public.master_line_of_business(lob_id),
  policy_type_id uuid NOT NULL REFERENCES public.master_policy_types(id),
  plan_type_id uuid REFERENCES public.master_plan_types(plan_type_id),
  product_code text NOT NULL UNIQUE,
  product_name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_product_lob_policy_plan ON public.master_product_name(lob_id, policy_type_id, plan_type_id);
CREATE INDEX idx_product_code ON public.master_product_name(product_code);
CREATE INDEX idx_product_status ON public.master_product_name(status);

-- Enable RLS
ALTER TABLE public.master_product_name ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read product names" 
ON public.master_product_name 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage product names" 
ON public.master_product_name 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_master_product_name_updated_at
  BEFORE UPDATE ON public.master_product_name
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();