-- Enable RLS on existing tables that don't have it
-- Only enable RLS on tables that actually exist

-- Check and enable RLS for policies table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policies') THEN
    ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
    -- Add basic policy for policies
    CREATE POLICY IF NOT EXISTS "Tenant users can view their policies" 
    ON public.policies 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND (profiles.tenant_id = policies.tenant_id OR profiles.role = 'system_admin'::app_role)
      )
    );
  END IF;
END $$;

-- Check and enable RLS for tenant_subscriptions table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_subscriptions') THEN
    ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
    -- Add basic policy for tenant_subscriptions
    CREATE POLICY IF NOT EXISTS "Tenant admins can manage their subscriptions" 
    ON public.tenant_subscriptions 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND (profiles.tenant_id = tenant_subscriptions.tenant_id OR profiles.role = 'system_admin'::app_role)
        AND profiles.role = ANY(ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
      )
    );
  END IF;
END $$;

-- Check and enable RLS for subscription_plans table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') THEN
    ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
    -- Add basic policy for subscription_plans (public read)
    CREATE POLICY IF NOT EXISTS "All authenticated users can read subscription plans" 
    ON public.subscription_plans 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY IF NOT EXISTS "System admins can manage subscription plans" 
    ON public.subscription_plans 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'system_admin'::app_role
      )
    );
  END IF;
END $$;

-- Check and enable RLS for line_of_business table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'line_of_business') THEN
    ALTER TABLE public.line_of_business ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "All authenticated users can read line_of_business" 
    ON public.line_of_business 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY IF NOT EXISTS "System admins can manage line_of_business" 
    ON public.line_of_business 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'system_admin'::app_role
      )
    );
  END IF;
END $$;

-- Check and enable RLS for insurance_providers table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_providers') THEN
    ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "All authenticated users can read insurance_providers" 
    ON public.insurance_providers 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY IF NOT EXISTS "System admins can manage insurance_providers" 
    ON public.insurance_providers 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'system_admin'::app_role
      )
    );
  END IF;
END $$;