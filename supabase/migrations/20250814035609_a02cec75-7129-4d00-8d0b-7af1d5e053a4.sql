-- Create tenant organizations table
CREATE TABLE public.tenant_organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant_organizations
CREATE POLICY "System admins can manage all tenant organizations" 
ON public.tenant_organizations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'system_admin'
));

-- Add tenant_id to profiles table for multi-tenancy
ALTER TABLE public.profiles 
ADD COLUMN tenant_id uuid REFERENCES public.tenant_organizations(id);

-- Add password change tracking
ALTER TABLE public.profiles 
ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE;

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  plan_code TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2) NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  max_users INTEGER,
  max_policies INTEGER,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default_plan BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_plans
CREATE POLICY "System admins can manage all subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'system_admin'
));

CREATE POLICY "All authenticated users can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Create tenant subscriptions table
CREATE TABLE public.tenant_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenant_organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant_subscriptions
CREATE POLICY "System admins can manage all tenant subscriptions" 
ON public.tenant_subscriptions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'system_admin'
));

CREATE POLICY "Tenant admins can view their organization subscriptions" 
ON public.tenant_subscriptions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'tenant_admin' 
  AND tenant_id = tenant_subscriptions.tenant_id
));

-- Update triggers for timestamp management
CREATE TRIGGER update_tenant_organizations_updated_at
BEFORE UPDATE ON public.tenant_organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
BEFORE UPDATE ON public.tenant_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_name, plan_code, description, monthly_price, annual_price, max_users, max_policies, features) VALUES 
('Basic Plan', 'BASIC', 'Essential features for small organizations', 99.00, 999.00, 10, 100, '{"policy_management": true, "basic_reports": true, "email_support": true}'),
('Professional Plan', 'PRO', 'Advanced features for growing organizations', 199.00, 1999.00, 50, 500, '{"policy_management": true, "advanced_reports": true, "priority_support": true, "custom_workflows": true}'),
('Enterprise Plan', 'ENTERPRISE', 'Complete solution for large organizations', 399.00, 3999.00, -1, -1, '{"policy_management": true, "advanced_reports": true, "priority_support": true, "custom_workflows": true, "api_access": true, "white_label": true}');

-- Create system admin user function
CREATE OR REPLACE FUNCTION create_system_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insert into auth.users (this would normally be done by Supabase Auth)
  -- For demo purposes, we'll just create the profile
  -- The actual user creation should be done through Supabase Auth API
  
  -- Generate a UUID for the system admin
  admin_user_id := gen_random_uuid();
  
  -- Insert system admin profile
  INSERT INTO public.profiles (
    id,
    user_id, 
    email, 
    first_name, 
    last_name, 
    role,
    must_change_password,
    password_changed_at
  ) VALUES (
    gen_random_uuid(),
    admin_user_id,
    'system@admin.com',
    'System',
    'Administrator', 
    'system_admin',
    false,
    now()
  ) ON CONFLICT (user_id) DO NOTHING;
END;
$$;