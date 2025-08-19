-- ============================================================================
-- DATA MIGRATION - RESTART WITH PROPER ERROR HANDLING
-- ============================================================================

-- First, let's migrate master reference data (locations hierarchy)
-- Step 1: Countries from master_locations
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'country' as category,
    LEFT(UPPER(country), 3) as code,
    country as name,
    jsonb_build_object('type', 'country', 'iso_code', LEFT(UPPER(country), 3)) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    MIN(created_at) as created_at,
    MAX(COALESCE(updated_at, created_at)) as updated_at
FROM master_locations 
WHERE country IS NOT NULL AND TRIM(country) != ''
GROUP BY country, status
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Check progress
SELECT 'Countries migrated: ' || COUNT(*) as progress 
FROM master_reference_data WHERE category = 'country';