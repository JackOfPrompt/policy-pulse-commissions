-- Final security fixes for critical issues
-- Enable RLS on tables that are missing it and add essential policies

-- Enable RLS on remaining tables that need it
ALTER TABLE public.master_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_vehicle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_plan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_policy_tenure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_policy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_premium_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_premium_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_premium_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_product_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_relationship_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_line_of_business ENABLE ROW LEVEL SECURITY;

-- Add basic policies for master tables (read-only for authenticated users)
CREATE POLICY "Authenticated users can read master_cities" ON public.master_cities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_pincodes" ON public.master_pincodes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_states" ON public.master_states FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_countries" ON public.master_countries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_vehicle_data" ON public.master_vehicle_data FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_vehicle_types" ON public.master_vehicle_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_plan_types" ON public.master_plan_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_policy_tenure" ON public.master_policy_tenure FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_policy_types" ON public.master_policy_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_premium_frequencies" ON public.master_premium_frequencies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_premium_terms" ON public.master_premium_terms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_premium_types" ON public.master_premium_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_product_categories" ON public.master_product_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_product_names" ON public.master_product_names FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_relationship_codes" ON public.master_relationship_codes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read master_line_of_business" ON public.master_line_of_business FOR SELECT USING (auth.uid() IS NOT NULL);

-- System admin management policies for master tables
CREATE POLICY "System admins can manage master_cities" ON public.master_cities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_pincodes" ON public.master_pincodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_states" ON public.master_states FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_countries" ON public.master_countries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_vehicle_data" ON public.master_vehicle_data FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_vehicle_types" ON public.master_vehicle_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_plan_types" ON public.master_plan_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_policy_tenure" ON public.master_policy_tenure FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_policy_types" ON public.master_policy_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_premium_frequencies" ON public.master_premium_frequencies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_premium_terms" ON public.master_premium_terms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_premium_types" ON public.master_premium_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_product_categories" ON public.master_product_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_product_names" ON public.master_product_names FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_relationship_codes" ON public.master_relationship_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);
CREATE POLICY "System admins can manage master_line_of_business" ON public.master_line_of_business FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'system_admin'::app_role)
);

-- Fix function security by setting proper search_path
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = '';
ALTER FUNCTION public.get_tenant_roles(uuid) SET search_path = '';
ALTER FUNCTION public.get_org_hierarchy(uuid) SET search_path = '';
ALTER FUNCTION public.create_system_admin() SET search_path = '';
ALTER FUNCTION public.is_system_admin() SET search_path = '';

-- Fix any remaining security definer views by dropping them
DROP VIEW IF EXISTS policy_performance CASCADE;
DROP VIEW IF EXISTS insurer_summary CASCADE;
DROP VIEW IF EXISTS claims_summary CASCADE;
DROP VIEW IF EXISTS finance_summary CASCADE;