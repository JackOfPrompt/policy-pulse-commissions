-- Fix security issues: Set proper search_path for functions and enable RLS

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.update_tenant_organizations_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Enable RLS on tables that don't have it (master_occupations and master_policy_tenure)
ALTER TABLE public.master_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_policy_tenure ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for master_occupations
CREATE POLICY "Allow authenticated users to read occupations" 
ON public.master_occupations 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "System admins can manage occupations" 
ON public.master_occupations 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Add RLS policies for master_policy_tenure
CREATE POLICY "Allow authenticated users to read policy tenure" 
ON public.master_policy_tenure 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "System admins can manage policy tenure" 
ON public.master_policy_tenure 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));