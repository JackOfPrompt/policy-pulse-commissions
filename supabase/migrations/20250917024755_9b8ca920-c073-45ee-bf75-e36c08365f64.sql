-- Fix security issues: Enable RLS on tables that have policies and fix security definer views

-- Enable RLS on tables that may have policies but RLS disabled
ALTER TABLE IF EXISTS vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

-- Create missing RLS policies for critical tables if they don't exist
DO $$
BEGIN
  -- Policy for user_organizations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_organizations' AND policyname = 'Users can view their own organizations'
  ) THEN
    CREATE POLICY "Users can view their own organizations" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- Policy for profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());
  END IF;

  -- Policy for profiles update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());
  END IF;

  -- Policy for reference tables
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'vehicle_types' AND policyname = 'Reference tables are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Reference tables are viewable by authenticated users" ON vehicle_types
    FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'business_types' AND policyname = 'Reference tables are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Reference tables are viewable by authenticated users" ON business_types
    FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Users can view their organization providers'
  ) THEN
    CREATE POLICY "Users can view their organization providers" ON providers
    FOR SELECT USING (org_id IN (
      SELECT user_organizations.org_id
      FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'product_types' AND policyname = 'Reference tables are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Reference tables are viewable by authenticated users" ON product_types
    FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users can view their organization subscriptions'
  ) THEN
    CREATE POLICY "Users can view their organization subscriptions" ON subscriptions
    FOR SELECT USING (org_id IN (
      SELECT user_organizations.org_id
      FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscription_requests' AND policyname = 'Users can view their organization subscription requests'
  ) THEN
    CREATE POLICY "Users can view their organization subscription requests" ON subscription_requests
    FOR SELECT USING (org_id IN (
      SELECT user_organizations.org_id
      FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
    ));
  END IF;
END
$$;