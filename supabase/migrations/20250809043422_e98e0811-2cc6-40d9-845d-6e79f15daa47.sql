-- Phase 2: Scope tenant visibility for policies and provider/product catalogs

-- 1) Add tenant_id to key transactional tables (if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='policies_new' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.policies_new ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_policies_new_tenant_id ON public.policies_new(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payout_transactions' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.payout_transactions ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_payout_transactions_tenant_id ON public.payout_transactions(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='policy_renewals' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.policy_renewals ADD COLUMN tenant_id UUID;
    CREATE INDEX IF NOT EXISTS idx_policy_renewals_tenant_id ON public.policy_renewals(tenant_id);
  END IF;
END $$;

-- 2) Ensure RLS is enabled on these tables
ALTER TABLE public.policies_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewals ENABLE ROW LEVEL SECURITY;

-- 3) RLS policies for tenant-scoped access on policies and payouts/renewals
DO $$ BEGIN
  -- Policies: admin manage; tenant users view; tenant admins manage their tenant
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policies_new' AND policyname='Admins manage policies'
  ) THEN
    CREATE POLICY "Admins manage policies" ON public.policies_new
    FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policies_new' AND policyname='Tenant users can view policies'
  ) THEN
    CREATE POLICY "Tenant users can view policies" ON public.policies_new
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policies_new' AND policyname='Tenant admins can manage policies'
  ) THEN
    CREATE POLICY "Tenant admins can manage policies" ON public.policies_new
    FOR ALL TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
END $$;

DO $$ BEGIN
  -- Payout transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payout_transactions' AND policyname='Admins manage payout txns'
  ) THEN
    CREATE POLICY "Admins manage payout txns" ON public.payout_transactions
    FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payout_transactions' AND policyname='Tenant users can view payout txns'
  ) THEN
    CREATE POLICY "Tenant users can view payout txns" ON public.payout_transactions
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payout_transactions' AND policyname='Tenant admins can manage payout txns'
  ) THEN
    CREATE POLICY "Tenant admins can manage payout txns" ON public.payout_transactions
    FOR ALL TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
END $$;

DO $$ BEGIN
  -- Policy renewals
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_renewals' AND policyname='Admins manage renewals'
  ) THEN
    CREATE POLICY "Admins manage renewals" ON public.policy_renewals
    FOR ALL USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_renewals' AND policyname='Tenant users can view renewals'
  ) THEN
    CREATE POLICY "Tenant users can view renewals" ON public.policy_renewals
    FOR SELECT TO authenticated
    USING (tenant_id IS NOT NULL AND tenant_id = ANY (public.current_user_tenant_ids()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_renewals' AND policyname='Tenant admins can manage renewals'
  ) THEN
    CREATE POLICY "Tenant admins can manage renewals" ON public.policy_renewals
    FOR ALL TO authenticated
    USING (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id))
    WITH CHECK (tenant_id IS NOT NULL AND public.is_tenant_admin_for(tenant_id));
  END IF;
END $$;

-- 4) Catalog visibility from System Admin data: providers, products, LOBs
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_of_business ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Providers: allow read for all authenticated tenants (active only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='insurance_providers' AND policyname='Auth can view active providers'
  ) THEN
    CREATE POLICY "Auth can view active providers" ON public.insurance_providers
    FOR SELECT TO authenticated USING (status = 'Active');
  END IF;
END $$;

DO $$ BEGIN
  -- Products: allow read for all authenticated tenants (active only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='insurance_products' AND policyname='Auth can view active products'
  ) THEN
    CREATE POLICY "Auth can view active products" ON public.insurance_products
    FOR SELECT TO authenticated USING (status = 'Active');
  END IF;
END $$;

DO $$ BEGIN
  -- LOBs: allow read (active only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='line_of_business' AND policyname='Auth can view active LOBs'
  ) THEN
    CREATE POLICY "Auth can view active LOBs" ON public.line_of_business
    FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;