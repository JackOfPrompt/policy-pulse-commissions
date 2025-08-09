-- Fix security issues: Enable RLS on missing tables and fix function security
-- Enable RLS on tables that are missing it
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies_with_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_reports ENABLE ROW LEVEL SECURITY;

-- Fix search path for security-definer functions
ALTER FUNCTION public.can_transition_policy_status(policy_status_enum, policy_status_enum, uuid) 
SET search_path = '';

ALTER FUNCTION public.update_policy_alerts() 
SET search_path = '';

-- Add basic RLS policies for newly protected tables
CREATE POLICY "Admin can manage policies" 
ON public.policies 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE POLICY "Admin can view policies_with_details" 
ON public.policies_with_details 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE POLICY "Admin can view active_commission_rules" 
ON public.active_commission_rules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE POLICY "Admin can view payout_reports" 
ON public.payout_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));