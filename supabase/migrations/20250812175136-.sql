-- MDM core entities schema and policies
-- 1) Create status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mdm_status') THEN
    CREATE TYPE public.mdm_status AS ENUM ('active','inactive');
  END IF;
END $$;

-- 2) Tables
-- LOBs
CREATE TABLE IF NOT EXISTS public.mdm_lobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- optional external identifier for interoperability
  lob_id uuid UNIQUE,
  tenant_id uuid NULL,
  lob_name text NOT NULL,
  lob_code text NOT NULL UNIQUE,
  description text NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product Types (depends on LOB)
CREATE TABLE IF NOT EXISTS public.mdm_product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id uuid UNIQUE,
  tenant_id uuid NULL,
  lob_id uuid NOT NULL REFERENCES public.mdm_lobs(id) ON DELETE RESTRICT,
  product_type_name text NOT NULL,
  product_type_code text NOT NULL UNIQUE,
  description text NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Policy Types (depends on Product Type)
CREATE TABLE IF NOT EXISTS public.mdm_policy_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type_id uuid UNIQUE,
  tenant_id uuid NULL,
  product_type_id uuid NOT NULL REFERENCES public.mdm_product_types(id) ON DELETE RESTRICT,
  policy_type_name text NOT NULL,
  policy_type_code text NOT NULL UNIQUE,
  description text NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Plan Types (depends on Policy Type)
CREATE TABLE IF NOT EXISTS public.mdm_plan_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type_id uuid UNIQUE,
  tenant_id uuid NULL,
  policy_type_id uuid NOT NULL REFERENCES public.mdm_policy_types(id) ON DELETE RESTRICT,
  plan_type_name text NOT NULL,
  plan_type_code text NOT NULL UNIQUE,
  description text NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Policy Sub-Types (depends on Plan Type)
CREATE TABLE IF NOT EXISTS public.mdm_policy_sub_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_sub_type_id uuid UNIQUE,
  tenant_id uuid NULL,
  plan_type_id uuid NOT NULL REFERENCES public.mdm_plan_types(id) ON DELETE RESTRICT,
  sub_type_name text NOT NULL,
  sub_type_code text NOT NULL UNIQUE,
  description text NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insurance Providers
CREATE TABLE IF NOT EXISTS public.mdm_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid UNIQUE,
  tenant_id uuid NULL,
  provider_name text NOT NULL,
  provider_code text NOT NULL UNIQUE,
  contact_email text NULL,
  phone_number text NULL,
  website_url text NULL,
  address text NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products (depends on Provider and Product Type)
CREATE TABLE IF NOT EXISTS public.mdm_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE,
  tenant_id uuid NULL,
  provider_id uuid NOT NULL REFERENCES public.mdm_providers(id) ON DELETE RESTRICT,
  product_type_id uuid NOT NULL REFERENCES public.mdm_product_types(id) ON DELETE RESTRICT,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text NULL,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add-ons
CREATE TABLE IF NOT EXISTS public.mdm_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id uuid UNIQUE,
  tenant_id uuid NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  status public.mdm_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mdm_product_types_lob_id ON public.mdm_product_types(lob_id);
CREATE INDEX IF NOT EXISTS idx_mdm_policy_types_product_type_id ON public.mdm_policy_types(product_type_id);
CREATE INDEX IF NOT EXISTS idx_mdm_plan_types_policy_type_id ON public.mdm_plan_types(policy_type_id);
CREATE INDEX IF NOT EXISTS idx_mdm_policy_sub_types_plan_type_id ON public.mdm_policy_sub_types(plan_type_id);
CREATE INDEX IF NOT EXISTS idx_mdm_products_provider_id ON public.mdm_products(provider_id);
CREATE INDEX IF NOT EXISTS idx_mdm_products_product_type_id ON public.mdm_products(product_type_id);

-- 4) Enable RLS and apply policies
SELECT public.mdm_apply_policies('public.mdm_lobs');
SELECT public.mdm_apply_policies('public.mdm_product_types');
SELECT public.mdm_apply_policies('public.mdm_policy_types');
SELECT public.mdm_apply_policies('public.mdm_plan_types');
SELECT public.mdm_apply_policies('public.mdm_policy_sub_types');
SELECT public.mdm_apply_policies('public.mdm_providers');
SELECT public.mdm_apply_policies('public.mdm_products');
SELECT public.mdm_apply_policies('public.mdm_addons');

-- 5) updated_at triggers
CREATE TRIGGER update_mdm_lobs_updated_at
BEFORE UPDATE ON public.mdm_lobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_mdm_product_types_updated_at
BEFORE UPDATE ON public.mdm_product_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_mdm_policy_types_updated_at
BEFORE UPDATE ON public.mdm_policy_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_mdm_plan_types_updated_at
BEFORE UPDATE ON public.mdm_plan_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_mdm_policy_sub_types_updated_at
BEFORE UPDATE ON public.mdm_policy_sub_types
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_mdm_providers_updated_at
BEFORE UPDATE ON public.mdm_providers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_mdm_products_updated_at
BEFORE UPDATE ON public.mdm_products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_mdm_addons_updated_at
BEFORE UPDATE ON public.mdm_addons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();