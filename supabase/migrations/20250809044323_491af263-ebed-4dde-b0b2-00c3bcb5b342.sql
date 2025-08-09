-- Fix migration: recreate policies without IF NOT EXISTS

-- 1) Tenant Product Catalog
CREATE TABLE IF NOT EXISTS public.tenant_product_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.insurance_products(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  visible boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, product_id)
);

ALTER TABLE public.tenant_product_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage tenant_product_catalog" ON public.tenant_product_catalog;
CREATE POLICY "Admin can manage tenant_product_catalog"
ON public.tenant_product_catalog
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Tenant admins can manage their product catalog" ON public.tenant_product_catalog;
CREATE POLICY "Tenant admins can manage their product catalog"
ON public.tenant_product_catalog
FOR ALL
USING (public.is_tenant_admin_for(tenant_id))
WITH CHECK (public.is_tenant_admin_for(tenant_id));

DROP POLICY IF EXISTS "Tenant users can view their product catalog" ON public.tenant_product_catalog;
CREATE POLICY "Tenant users can view their product catalog"
ON public.tenant_product_catalog
FOR SELECT
USING (tenant_id = ANY (public.current_user_tenant_ids()));

DROP TRIGGER IF EXISTS trg_tenant_product_catalog_updated_at ON public.tenant_product_catalog;
CREATE TRIGGER trg_tenant_product_catalog_updated_at
BEFORE UPDATE ON public.tenant_product_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Tenant Product Overrides
CREATE TABLE IF NOT EXISTS public.tenant_product_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.insurance_products(id) ON DELETE CASCADE,
  name text,
  description text,
  status text,
  brochure_file_path text,
  available_addons jsonb,
  premium_frequency_options premium_frequency_enum[],
  premium_markup_rate numeric,
  premium_flat_add numeric,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, product_id)
);

ALTER TABLE public.tenant_product_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage tenant_product_overrides" ON public.tenant_product_overrides;
CREATE POLICY "Admin can manage tenant_product_overrides"
ON public.tenant_product_overrides
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Tenant admins can manage their product overrides" ON public.tenant_product_overrides;
CREATE POLICY "Tenant admins can manage their product overrides"
ON public.tenant_product_overrides
FOR ALL
USING (public.is_tenant_admin_for(tenant_id))
WITH CHECK (public.is_tenant_admin_for(tenant_id));

DROP POLICY IF EXISTS "Tenant users can view their product overrides" ON public.tenant_product_overrides;
CREATE POLICY "Tenant users can view their product overrides"
ON public.tenant_product_overrides
FOR SELECT
USING (tenant_id = ANY (public.current_user_tenant_ids()));

DROP TRIGGER IF EXISTS trg_tenant_product_overrides_updated_at ON public.tenant_product_overrides;
CREATE TRIGGER trg_tenant_product_overrides_updated_at
BEFORE UPDATE ON public.tenant_product_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Tenant Provider Catalog
CREATE TABLE IF NOT EXISTS public.tenant_provider_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.insurance_providers(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  visible boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider_id)
);

ALTER TABLE public.tenant_provider_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage tenant_provider_catalog" ON public.tenant_provider_catalog;
CREATE POLICY "Admin can manage tenant_provider_catalog"
ON public.tenant_provider_catalog
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Tenant admins can manage their provider catalog" ON public.tenant_provider_catalog;
CREATE POLICY "Tenant admins can manage their provider catalog"
ON public.tenant_provider_catalog
FOR ALL
USING (public.is_tenant_admin_for(tenant_id))
WITH CHECK (public.is_tenant_admin_for(tenant_id));

DROP POLICY IF EXISTS "Tenant users can view their provider catalog" ON public.tenant_provider_catalog;
CREATE POLICY "Tenant users can view their provider catalog"
ON public.tenant_provider_catalog
FOR SELECT
USING (tenant_id = ANY (public.current_user_tenant_ids()));

DROP TRIGGER IF EXISTS trg_tenant_provider_catalog_updated_at ON public.tenant_provider_catalog;
CREATE TRIGGER trg_tenant_provider_catalog_updated_at
BEFORE UPDATE ON public.tenant_provider_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Resolved views
CREATE OR REPLACE VIEW public.tenant_products_resolved AS
SELECT
  tpc.tenant_id,
  ip.id AS product_id,
  COALESCE(tpo.name, ip.name) AS name,
  COALESCE(tpo.description, ip.description) AS description,
  ip.provider_id,
  ip.line_of_business_id,
  ip.code,
  ip.category,
  ip.coverage_type,
  ip.premium_type,
  COALESCE(tpo.status, ip.status) AS status,
  ip.min_sum_insured,
  ip.max_sum_insured,
  COALESCE(tpo.premium_frequency_options, ip.premium_frequency_options) AS premium_frequency_options,
  COALESCE(tpo.available_addons, ip.available_addons) AS available_addons,
  COALESCE(tpo.brochure_file_path, ip.brochure_file_path) AS brochure_file_path,
  tpo.premium_markup_rate,
  tpo.premium_flat_add,
  tpc.is_enabled,
  tpc.visible,
  GREATEST(tpc.effective_from, COALESCE(tpo.effective_from, tpc.effective_from)) AS effective_from,
  LEAST(COALESCE(tpc.effective_to, '9999-12-31'::date), COALESCE(tpo.effective_to, '9999-12-31'::date)) AS effective_to
FROM public.tenant_product_catalog tpc
JOIN public.insurance_products ip ON ip.id = tpc.product_id
LEFT JOIN public.tenant_product_overrides tpo
  ON tpo.tenant_id = tpc.tenant_id AND tpo.product_id = tpc.product_id
WHERE (tpc.effective_to IS NULL OR tpc.effective_to >= CURRENT_DATE)
  AND (tpo.id IS NULL OR tpo.effective_to IS NULL OR tpo.effective_to >= CURRENT_DATE)
  AND tpc.is_enabled = true
  AND tpc.visible = true;

CREATE OR REPLACE VIEW public.tenant_providers_resolved AS
SELECT
  tpr.tenant_id,
  ip.id AS provider_id,
  ip.provider_name,
  ip.status,
  ip.logo_file_path,
  ip.logo_url,
  ip.website,
  tpr.is_enabled,
  tpr.visible,
  GREATEST(tpr.effective_from, CURRENT_DATE) AS effective_from,
  COALESCE(tpr.effective_to, '9999-12-31'::date) AS effective_to
FROM public.tenant_provider_catalog tpr
JOIN public.insurance_providers ip ON ip.id = tpr.provider_id
WHERE (tpr.effective_to IS NULL OR tpr.effective_to >= CURRENT_DATE)
  AND tpr.is_enabled = true
  AND tpr.visible = true;