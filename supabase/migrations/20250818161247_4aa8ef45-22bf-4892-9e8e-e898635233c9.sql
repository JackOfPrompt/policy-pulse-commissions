-- Final security cleanup - handle existing tables and policies properly
-- Enable RLS on tables that exist and add policies safely

-- Enable RLS on policies table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policies') THEN
    ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on other key tables if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_subscriptions') THEN
    ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans') THEN
    ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'line_of_business') THEN
    ALTER TABLE public.line_of_business ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_providers') THEN
    ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add basic policies for core tables (only if table exists and policy doesn't exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policies')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'policies' AND policyname = 'Tenant users can view their policies') THEN
    CREATE POLICY "Tenant users can view their policies" 
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

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscription_plans' AND policyname = 'All authenticated users can read subscription plans') THEN
    CREATE POLICY "All authenticated users can read subscription plans" 
    ON public.subscription_plans 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'line_of_business')
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'line_of_business' AND policyname = 'All authenticated users can read line_of_business') THEN
    CREATE POLICY "All authenticated users can read line_of_business" 
    ON public.line_of_business 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;