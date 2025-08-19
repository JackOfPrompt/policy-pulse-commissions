-- Create a simple development credentials table and seed dummy users for all roles
-- This is intended for development/testing only

-- 1) Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Enable RLS with permissive policies (dev only)
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_credentials' AND policyname = 'dev_anyone_can_select_user_credentials'
  ) THEN
    CREATE POLICY "dev_anyone_can_select_user_credentials"
      ON public.user_credentials
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_credentials' AND policyname = 'dev_anyone_can_insert_user_credentials'
  ) THEN
    CREATE POLICY "dev_anyone_can_insert_user_credentials"
      ON public.user_credentials
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_credentials' AND policyname = 'dev_anyone_can_update_user_credentials'
  ) THEN
    CREATE POLICY "dev_anyone_can_update_user_credentials"
      ON public.user_credentials
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 3) Updated_at trigger (reuse common function if present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_credentials_updated_at'
  ) THEN
    CREATE TRIGGER update_user_credentials_updated_at
    BEFORE UPDATE ON public.user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) Create master_occupations table if it doesn't exist (fixes import modal error)
CREATE TABLE IF NOT EXISTS public.master_occupations (
  occupation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_name text NOT NULL,
  occupation_code text UNIQUE NOT NULL,
  category text,
  risk_level text DEFAULT 'Medium',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for master_occupations
ALTER TABLE public.master_occupations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'master_occupations' AND policyname = 'allow_authenticated_read_occupations'
  ) THEN
    CREATE POLICY "allow_authenticated_read_occupations"
      ON public.master_occupations
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'master_occupations' AND policyname = 'system_admins_manage_occupations'
  ) THEN
    CREATE POLICY "system_admins_manage_occupations"
      ON public.master_occupations
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'system_admin'
      ));
  END IF;
END $$;

-- 5) Seed five dummy users - avoiding email conflicts
DO $$
DECLARE
  tenant_dummy uuid := gen_random_uuid();
  sys_id uuid;
  ten_admin_id uuid;
  emp_id uuid;
  agent_id uuid;
  cust_id uuid;
BEGIN
  -- Delete any existing test users first to avoid conflicts
  DELETE FROM public.profiles WHERE email IN (
    'admin@system.com', 'tenant@admin.com', 'employee@company.com', 
    'agent@insurance.com', 'customer@email.com'
  );
  DELETE FROM public.user_credentials WHERE email IN (
    'admin@system.com', 'tenant@admin.com', 'employee@company.com', 
    'agent@insurance.com', 'customer@email.com'
  );

  -- Insert credentials (passwords are plain for dev only)
  INSERT INTO public.user_credentials (email, password_hash)
  VALUES
    ('admin@system.com', 'admin123'),
    ('tenant@admin.com', 'tenant123'),
    ('employee@company.com', 'employee123'),
    ('agent@insurance.com', 'agent123'),
    ('customer@email.com', 'customer123');

  -- Fetch IDs
  SELECT id INTO sys_id FROM public.user_credentials WHERE email = 'admin@system.com';
  SELECT id INTO ten_admin_id FROM public.user_credentials WHERE email = 'tenant@admin.com';
  SELECT id INTO emp_id FROM public.user_credentials WHERE email = 'employee@company.com';
  SELECT id INTO agent_id FROM public.user_credentials WHERE email = 'agent@insurance.com';
  SELECT id INTO cust_id FROM public.user_credentials WHERE email = 'customer@email.com';

  -- Insert profiles for each role
  INSERT INTO public.profiles (user_id, email, phone, first_name, last_name, role, tenant_id, must_change_password, password_changed_at, created_at, updated_at)
  VALUES
    (sys_id, 'admin@system.com', NULL, 'System', 'Admin', 'system_admin', NULL, false, now(), now(), now()),
    (ten_admin_id, 'tenant@admin.com', NULL, 'Tenant', 'Admin', 'tenant_admin', tenant_dummy, false, now(), now(), now()),
    (emp_id, 'employee@company.com', NULL, 'Tenant', 'Employee', 'tenant_employee', tenant_dummy, false, now(), now(), now()),
    (agent_id, 'agent@insurance.com', NULL, 'Tenant', 'Agent', 'tenant_agent', tenant_dummy, false, now(), now(), now()),
    (cust_id, 'customer@email.com', NULL, 'Tenant', 'Customer', 'customer', tenant_dummy, false, now(), now(), now());
END $$;