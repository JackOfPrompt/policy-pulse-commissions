-- Fix security issues: Enable RLS on missing tables (excluding views)
-- Enable RLS on tables that are missing it
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for newly protected tables
CREATE POLICY "Admin can manage policies" 
ON public.policies 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Add missing app_role enum values that are used in the functions
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ops';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'finance';