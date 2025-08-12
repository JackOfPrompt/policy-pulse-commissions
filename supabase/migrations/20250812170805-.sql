-- MDM schema migration
-- 1) Enums
DO $$ BEGIN
  CREATE TYPE public.mdm_status AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.mdm_approval_status AS ENUM ('draft','pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Audit table
CREATE TABLE IF NOT EXISTS public.mdm_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL,
  changed_data jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mdm_audit_logs ENABLE ROW LEVEL SECURITY;
-- Admins can view all logs
DO $$ BEGIN
  CREATE POLICY "MDM audit viewable by admins" ON public.mdm_audit_logs
  FOR SELECT USING (is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3) Generic audit trigger function
CREATE OR REPLACE FUNCTION public.mdm_write_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  rec jsonb;
  rid text;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    rec := to_jsonb(OLD);
    rid := coalesce((OLD).id::text, (OLD).code::text, (OLD).name::text);
    INSERT INTO public.mdm_audit_logs(table_name, record_id, action, changed_data, user_id)
    VALUES (TG_TABLE_NAME, rid, TG_OP, rec, auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    rec := to_jsonb(NEW);
    rid := coalesce((NEW).id::text, (NEW).code::text, (NEW).name::text);
    INSERT INTO public.mdm_audit_logs(table_name, record_id, action, changed_data, user_id)
    VALUES (TG_TABLE_NAME, rid, TG_OP, rec, auth.uid());
    RETURN NEW;
  ELSE
    rec := to_jsonb(NEW);
    rid := coalesce((NEW).id::text, (NEW).code::text, (NEW).name::text);
    INSERT INTO public.mdm_audit_logs(table_name, record_id, action, changed_data, user_id)
    VALUES (TG_TABLE_NAME, rid, TG_OP, rec, auth.uid());
    RETURN NEW;
  END IF;
END; $$;

-- 4) Version bump trigger
CREATE OR REPLACE FUNCTION public.mdm_bump_version() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  NEW.version := COALESCE(OLD.version, 1) + 1;
  RETURN NEW;
END; $$;

-- 5) Helper to create common policies for a table
CREATE OR REPLACE FUNCTION public.mdm_apply_policies(tbl regclass) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
  -- SELECT: admins see all; tenant admins see global or their tenant
  EXECUTE format('CREATE POLICY IF NOT EXISTS "mdm_select_%s" ON %s FOR SELECT USING (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND (tenant_id IS NULL OR tenant_id = current_user_tenant_id())))', tbl, tbl);
  -- INSERT: admins anywhere; tenant admin only for their tenant
  EXECUTE format('CREATE POLICY IF NOT EXISTS "mdm_insert_%s" ON %s FOR INSERT WITH CHECK (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()))', tbl, tbl);
  -- UPDATE: admins anywhere; tenant admin only modify their tenant (not global)
  EXECUTE format('CREATE POLICY IF NOT EXISTS "mdm_update_%s" ON %s FOR UPDATE USING (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id())) WITH CHECK (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()))', tbl, tbl);
  -- DELETE: admins anywhere; tenant admin only delete their tenant
  EXECUTE format('CREATE POLICY IF NOT EXISTS "mdm_delete_%s" ON %s FOR DELETE USING (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()))', tbl, tbl);
END; $$;

-- 6) Core tables
CREATE TABLE IF NOT EXISTS public.mdm_lobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  lob_name text NOT NULL,
  lob_code text NOT NULL,
  description text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lob_code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  lob_id uuid NOT NULL REFERENCES public.mdm_lobs(id) ON DELETE RESTRICT,
  product_type_name text NOT NULL,
  product_type_code text NOT NULL,
  description text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_type_code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_policy_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  product_type_id uuid NOT NULL REFERENCES public.mdm_product_types(id) ON DELETE RESTRICT,
  policy_type_name text NOT NULL,
  policy_type_code text NOT NULL,
  description text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (policy_type_code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_plan_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  policy_type_id uuid NOT NULL REFERENCES public.mdm_policy_types(id) ON DELETE RESTRICT,
  plan_type_name text NOT NULL,
  plan_type_code text NOT NULL,
  description text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_type_code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_policy_sub_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  plan_type_id uuid NOT NULL REFERENCES public.mdm_plan_types(id) ON DELETE RESTRICT,
  sub_type_name text NOT NULL,
  sub_type_code text NOT NULL,
  description text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sub_type_code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  provider_name text NOT NULL,
  provider_code text NOT NULL,
  contact_email text,
  phone_number text,
  website_url text,
  address text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  provider_id uuid NOT NULL REFERENCES public.mdm_insurance_providers(id) ON DELETE RESTRICT,
  product_type_id uuid NOT NULL REFERENCES public.mdm_product_types(id) ON DELETE RESTRICT,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_product_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  product_id uuid NOT NULL REFERENCES public.mdm_products(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.mdm_addons(id) ON DELETE CASCADE,
  pricing_method text,
  price_override numeric,
  UNIQUE(product_id, addon_id, tenant_id)
);

-- 7) Supporting data
CREATE TABLE IF NOT EXISTS public.mdm_vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  type_name text NOT NULL,
  type_code text NOT NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type_code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_vehicle_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  vehicle_type_id uuid REFERENCES public.mdm_vehicle_types(id) ON DELETE SET NULL,
  make text NOT NULL,
  model text NOT NULL,
  variant text,
  year int,
  fuel_type text,
  seating_capacity int,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mdm_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  city_name text NOT NULL,
  pincode text NOT NULL,
  state text,
  country text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pincode, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_relationship_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  code text NOT NULL,
  name text NOT NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_health_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  name text NOT NULL,
  description text,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mdm_business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  category_name text NOT NULL,
  code text NOT NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_occupations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  occupation_name text NOT NULL,
  code text NOT NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.mdm_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  dept_name text NOT NULL,
  code text NOT NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  approval_status public.mdm_approval_status NOT NULL DEFAULT 'approved',
  version int NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code, tenant_id)
);

-- 8) Triggers and policies application
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mdm_%' AND tablename <> 'mdm_audit_logs' LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at_%s BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER bump_version_%s BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.mdm_bump_version()', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.mdm_write_audit()', r.tablename, r.tablename);
    PERFORM public.mdm_apply_policies(format('public.%s', r.tablename)::regclass);
  END LOOP;
END $$;

-- 9) Set created_by/updated_by defaults via triggers
CREATE OR REPLACE FUNCTION public.mdm_set_user_columns() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
  ELSE
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END; $$;

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mdm_%' AND tablename <> 'mdm_audit_logs' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_user_%s ON public.%s', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER set_user_%s BEFORE INSERT OR UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.mdm_set_user_columns()', r.tablename, r.tablename);
  END LOOP;
END $$;
