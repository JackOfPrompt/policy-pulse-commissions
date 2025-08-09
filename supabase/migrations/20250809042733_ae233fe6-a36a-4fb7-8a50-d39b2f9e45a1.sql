-- Phase 1: Core multi-tenancy foundation and tenant scoping on key tables
-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status_enum') THEN
    CREATE TYPE public.tenant_status_enum AS ENUM ('Active','Inactive','Pending');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_level_enum') THEN
    CREATE TYPE public.support_level_enum AS ENUM ('Basic','Priority','Dedicated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_enum') THEN
    CREATE TYPE public.billing_cycle_enum AS ENUM ('Monthly','Yearly');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE public.payment_status_enum AS ENUM ('Paid','Pending','Overdue','Failed');
  END IF;
END $$;

-- 2) Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_code VARCHAR(20) UNIQUE,
  tenant_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  contact_email VARCHAR(150),
  phone_number VARCHAR(15),
  industry_type VARCHAR(50),
  logo_url TEXT,
  status tenant_status_enum NOT NULL DEFAULT 'Active',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3) Subscription plans (global catalog)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name VARCHAR(100) NOT NULL,
  plan_code VARCHAR(30) UNIQUE,
  description TEXT,
  monthly_price DECIMAL(10,2),
  annual_price DECIMAL(10,2),
  currency_code VARCHAR(10) DEFAULT 'INR',
  regional_prices JSONB,
  trial_days INT DEFAULT 0,
  includes_trial BOOLEAN DEFAULT false,
  max_users INT,
  max_agents INT,
  max_products INT,
  api_access BOOLEAN DEFAULT false,
  reporting_tools BOOLEAN DEFAULT false,
  support_level support_level_enum DEFAULT 'Basic',
  features JSONB,
  available_add_ons JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default_plan BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 4) Tenant subscriptions
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(plan_id) ON DELETE RESTRICT,
  plan_snapshot JSONB,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  billing_cycle billing_cycle_enum NOT NULL DEFAULT 'Monthly',
  payment_status payment_status_enum NOT NULL DEFAULT 'Pending',
  last_payment_date DATE,
  next_renewal_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  trial_used BOOLEAN DEFAULT false,
  trial_start_date DATE,
  trial_end_date DATE,
  current_add_ons JSONB,
  discount_code VARCHAR(50),
  payment_method VARCHAR(50),
  invoice_reference VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  cancelled_on DATE,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5) Tenant memberships mapping auth users to tenants
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tenant_user', -- e.g., tenant_admin, tenant_user
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- 6) Helper functions for RLS
CREATE OR REPLACE FUNCTION public.current_user_tenant_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(tu.tenant_id), ARRAY[]::uuid[])
  FROM public.tenant_users tu
  WHERE tu.user_id = auth.uid() AND tu.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin_for(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
      AND tu.tenant_id = p_tenant_id
      AND tu.is_active = true
      AND lower(tu.role) IN ('tenant_admin','admin')
  );
$$;

-- 7) RLS policies
-- Tenants: System Admins (global) manage; tenant users can view their tenant row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='System admins manage tenants'
  ) THEN
    CREATE POLICY "System admins manage tenants" ON public.tenants
    FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='Tenant users can view their tenant'
  ) THEN
    CREATE POLICY "Tenant users can view their tenant" ON public.tenants
    FOR SELECT USING (tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
END $$;

-- Subscription plans: admins manage; all authenticated can view active plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscription_plans' AND policyname='Admins manage plans'
  ) THEN
    CREATE POLICY "Admins manage plans" ON public.subscription_plans
    FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscription_plans' AND policyname='Auth can view active plans'
  ) THEN
    CREATE POLICY "Auth can view active plans" ON public.subscription_plans
    FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;

-- Tenant subscriptions: admins manage; tenant users view their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_subscriptions' AND policyname='Admins manage tenant subscriptions'
  ) THEN
    CREATE POLICY "Admins manage tenant subscriptions" ON public.tenant_subscriptions
    FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_subscriptions' AND policyname='Tenant users view their subscriptions'
  ) THEN
    CREATE POLICY "Tenant users view their subscriptions" ON public.tenant_subscriptions
    FOR SELECT USING (tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
END $$;

-- Tenant users: admins manage; tenant admins manage their tenant; users can view their own membership
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_users' AND policyname='Admins manage tenant users'
  ) THEN
    CREATE POLICY "Admins manage tenant users" ON public.tenant_users
    FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_users' AND policyname='Tenant admins manage their tenant users'
  ) THEN
    CREATE POLICY "Tenant admins manage their tenant users" ON public.tenant_users
    FOR ALL TO authenticated
    USING (public.is_tenant_admin_for(tenant_id))
    WITH CHECK (public.is_tenant_admin_for(tenant_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_users' AND policyname='Users can view their own tenant memberships'
  ) THEN
    CREATE POLICY "Users can view their own tenant memberships" ON public.tenant_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- 8) Add tenant_id to key existing tables (nullable for backward compatibility)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='branches' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.branches ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON public.branches(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agents' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_agents_tenant_id ON public.agents(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='commissions' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.commissions ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_commissions_tenant_id ON public.commissions(tenant_id);
  END IF;
END $$;

-- 9) RLS policies for tenant-scoped access on key tables
-- Note: keep existing admin policies; add complementary tenant policies
-- Branches
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='branches' AND policyname='Tenant users can view branches'
  ) THEN
    CREATE POLICY "Tenant users can view branches" ON public.branches
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='branches' AND policyname='Tenant admins can insert branches'
  ) THEN
    CREATE POLICY "Tenant admins can insert branches" ON public.branches
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='branches' AND policyname='Tenant admins can update branches'
  ) THEN
    CREATE POLICY "Tenant admins can update branches" ON public.branches
    FOR UPDATE TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='branches' AND policyname='Tenant admins can delete branches'
  ) THEN
    CREATE POLICY "Tenant admins can delete branches" ON public.branches
    FOR DELETE TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
END $$;

-- Employees
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employees' AND policyname='Tenant users can view employees'
  ) THEN
    CREATE POLICY "Tenant users can view employees" ON public.employees
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employees' AND policyname='Tenant admins can manage employees'
  ) THEN
    CREATE POLICY "Tenant admins can manage employees" ON public.employees
    FOR ALL TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
END $$;

-- Agents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agents' AND policyname='Tenant users can view agents'
  ) THEN
    CREATE POLICY "Tenant users can view agents" ON public.agents
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agents' AND policyname='Tenant admins can manage agents'
  ) THEN
    CREATE POLICY "Tenant admins can manage agents" ON public.agents
    FOR ALL TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
END $$;

-- Leads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Tenant users can view leads by tenant'
  ) THEN
    CREATE POLICY "Tenant users can view leads by tenant" ON public.leads
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Tenant admins can insert/update leads by tenant'
  ) THEN
    CREATE POLICY "Tenant admins can insert/update leads by tenant" ON public.leads
    FOR ALL TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
END $$;

-- Commissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='commissions' AND policyname='Tenant users can view commissions'
  ) THEN
    CREATE POLICY "Tenant users can view commissions" ON public.commissions
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  -- Management (insert/update/delete) typically handled by system processes; keep for admins only for now
END $$;

-- 10) Trigger to auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenants_touch_updated_at'
  ) THEN
    CREATE TRIGGER trg_tenants_touch_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subscription_plans_touch_updated_at'
  ) THEN
    CREATE TRIGGER trg_subscription_plans_touch_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenant_subscriptions_touch_updated_at'
  ) THEN
    CREATE TRIGGER trg_tenant_subscriptions_touch_updated_at
    BEFORE UPDATE ON public.tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tenant_users_touch_updated_at'
  ) THEN
    CREATE TRIGGER trg_tenant_users_touch_updated_at
    BEFORE UPDATE ON public.tenant_users
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;