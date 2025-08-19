-- Complete Missing Table Mappings and Data Migration (corrected to match current schema)
-- This script adapts to existing column types and RLS.

-- 0) Prepare a tenant context for RLS on commission_structures
DO $$
DECLARE
  v_tenant uuid;
BEGIN
  SELECT p.tenant_id INTO v_tenant
  FROM profiles p
  WHERE p.tenant_id IS NOT NULL
  LIMIT 1;

  IF v_tenant IS NULL THEN
    -- In rare cases with no tenant yet, generate a placeholder to satisfy policy comparisons
    v_tenant := gen_random_uuid();
  END IF;

  PERFORM set_config('app.tenant_id', v_tenant::text, true);
END$$;

-- 1) Populate products_unified from master data (aligning with current columns)
-- columns: id (uuid), tenant_id (text), name (varchar), type (varchar), status (varchar),
-- provider_id (text), lob_id (text), product_config/pricing_config/eligibility_config/coverage_config (jsonb),
-- is_active (boolean), created_at/updated_at (timestamptz), created_by (uuid)
INSERT INTO products_unified (
  id, tenant_id, name, type, status, provider_id, lob_id,
  product_config, pricing_config, eligibility_config, coverage_config,
  is_active, created_at, updated_at, created_by
)
SELECT 
  gen_random_uuid() AS id,
  COALESCE(ta.tenant_id::text, 'global') AS tenant_id,
  mip.provider_name AS name,
  'insurance' AS type,
  COALESCE(mip.status::text, 'Active') AS status,
  mip.provider_id::text AS provider_id,
  lob_pick.lob_id::text AS lob_id,
  jsonb_build_object(
    'product_type', 'insurance',
    'is_digital', true,
    'requires_medical', false,
    'auto_underwriting', true
  ) AS product_config,
  jsonb_build_object(
    'base_premium', 1000,
    'currency', 'INR',
    'tax_rate', 18,
    'commission_rate', 10
  ) AS pricing_config,
  jsonb_build_object(
    'min_age', 18,
    'max_age', 65,
    'min_income', 0,
    'occupation_allowed', true
  ) AS eligibility_config,
  jsonb_build_object(
    'sum_insured_min', 100000,
    'sum_insured_max', 10000000,
    'policy_term', 1,
    'waiting_period', 0
  ) AS coverage_config,
  true AS is_active,
  now() AS created_at,
  now() AS updated_at,
  sa.user_id AS created_by
FROM master_insurance_providers mip
-- pick any active LOB once to avoid large cartesian explosion
CROSS JOIN LATERAL (
  SELECT mlob.lob_id 
  FROM master_line_of_business mlob 
  WHERE mlob.status = 'Active' 
  LIMIT 1
) AS lob_pick
-- tie to a tenant admin if present (for created_by and tenant_id)
LEFT JOIN LATERAL (
  SELECT p.user_id, p.tenant_id
  FROM profiles p
  WHERE p.role = 'tenant_admin'
  LIMIT 1
) AS ta ON true
LEFT JOIN LATERAL (
  SELECT p.user_id
  FROM profiles p
  WHERE p.role = 'system_admin'
  LIMIT 1
) AS sa ON true
WHERE mip.status = 'Active'
  AND NOT EXISTS (
    SELECT 1 FROM products_unified pu
    WHERE pu.provider_id = mip.provider_id::text
      AND pu.name = mip.provider_name
  );

-- 2) Create provider-LOB mappings (match existing table columns)
-- provider_lob_map columns: map_id uuid, provider_id uuid, lob_id uuid, created_at timestamptz
INSERT INTO provider_lob_map (map_id, provider_id, lob_id, created_at)
SELECT 
  gen_random_uuid() AS map_id,
  mip.provider_id AS provider_id,
  mlob.lob_id AS lob_id,
  now() AS created_at
FROM master_insurance_providers mip
CROSS JOIN master_line_of_business mlob
WHERE mip.status = 'Active' AND mlob.status = 'Active'
  AND NOT EXISTS (
    SELECT 1 FROM provider_lob_map plm
    WHERE plm.provider_id = mip.provider_id AND plm.lob_id = mlob.lob_id
  )
LIMIT 50;

-- 3) Create addon-category mappings (use master_product_category which has UUID category_id)
-- addon_category_map: (map_id uuid, addon_id uuid, category_id uuid, subcategory_id uuid NULL, is_active bool, created_at, updated_at)
INSERT INTO addon_category_map (map_id, addon_id, category_id, subcategory_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid() AS map_id,
  ma.addon_id AS addon_id,
  mpc.category_id AS category_id,
  NULL::uuid AS subcategory_id,
  true AS is_active,
  now() AS created_at,
  now() AS updated_at
FROM master_addon ma
CROSS JOIN master_product_category mpc
WHERE ma.is_active = true AND mpc.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM addon_category_map acm
    WHERE acm.addon_id = ma.addon_id AND acm.category_id = mpc.category_id
  )
LIMIT 20;

-- 4) Create sample commission structures (respecting RLS by using app.tenant_id)
-- commission_structures: id text, tenant_id uuid, rule_name varchar, rule_type varchar, criteria jsonb, rules jsonb,
-- valid_from date, valid_to date, approval_status varchar, created_by uuid, created_at, updated_at
INSERT INTO commission_structures (
  id, tenant_id, rule_name, rule_type, criteria, rules, valid_from, valid_to,
  approval_status, created_by, created_at, updated_at
)
SELECT 
  gen_random_uuid()::text AS id,
  current_setting('app.tenant_id', true)::uuid AS tenant_id,
  'Standard Commission Rule ' || mip.provider_name AS rule_name,
  'base' AS rule_type,
  jsonb_build_object(
    'provider_id', mip.provider_id,
    'lob_id', mlob.lob_id,
    'channel', 'direct',
    'policy_year', 1
  ) AS criteria,
  jsonb_build_object(
    'base_rate', 10.0,
    'slabs', jsonb_build_array(
      jsonb_build_object('min_value', 0, 'max_value', 100000, 'rate', 8.0),
      jsonb_build_object('min_value', 100000, 'max_value', 500000, 'rate', 10.0)
    ),
    'renewal_rates', jsonb_build_array(
      jsonb_build_object('year', 2, 'rate', 5.0),
      jsonb_build_object('year', 3, 'rate', 3.0)
    )
  ) AS rules,
  CURRENT_DATE AS valid_from,
  (CURRENT_DATE + INTERVAL '1 year')::date AS valid_to,
  'active' AS approval_status,
  sa.user_id AS created_by,
  now() AS created_at,
  now() AS updated_at
FROM master_insurance_providers mip
CROSS JOIN master_line_of_business mlob
LEFT JOIN LATERAL (
  SELECT p.user_id FROM profiles p WHERE p.role = 'system_admin' LIMIT 1
) AS sa ON true
WHERE mip.status = 'Active' AND mlob.status = 'Active'
  AND NOT EXISTS (
    SELECT 1 FROM commission_structures cs
    WHERE (cs.criteria->>'provider_id')::uuid = mip.provider_id
      AND (cs.criteria->>'lob_id')::uuid = mlob.lob_id
      AND cs.tenant_id = current_setting('app.tenant_id', true)::uuid
  )
LIMIT 10;

-- 5) Verification: Check populated mappings (ensure consistent aliasing)
WITH mapping_summary AS (
  SELECT 'products_unified' AS table_name, COUNT(*)::bigint AS record_count FROM products_unified
  UNION ALL
  SELECT 'commission_structures' AS table_name, COUNT(*)::bigint AS record_count FROM commission_structures
  UNION ALL
  SELECT 'provider_lob_map' AS table_name, COUNT(*)::bigint AS record_count FROM provider_lob_map
  UNION ALL
  SELECT 'addon_category_map' AS table_name, COUNT(*)::bigint AS record_count FROM addon_category_map
)
SELECT 'MAPPING_COMPLETION_SUMMARY' AS status, table_name, record_count
FROM mapping_summary
ORDER BY table_name;