-- Step 2: Migrate States
WITH country_refs AS (
    SELECT id, name FROM master_reference_data WHERE category = 'country'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'state' as category,
    LEFT(UPPER(REPLACE(ml.state, ' ', '')), 5) as code,
    ml.state as name,
    cr.id as parent_id,
    jsonb_build_object(
        'type', 'state', 
        'country_name', ml.country,
        'state_code', LEFT(UPPER(REPLACE(ml.state, ' ', '')), 5)
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    MIN(ml.created_at) as created_at,
    MAX(COALESCE(ml.updated_at, ml.created_at)) as updated_at
FROM master_locations ml
JOIN country_refs cr ON cr.name = ml.country
WHERE ml.state IS NOT NULL AND TRIM(ml.state) != ''
GROUP BY ml.state, ml.country, ml.status, cr.id
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Step 3: Migrate Districts  
WITH state_refs AS (
    SELECT id, name, metadata->>'country_name' as country_name 
    FROM master_reference_data WHERE category = 'state'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'district' as category,
    LEFT(UPPER(REPLACE(ml.district, ' ', '_')), 10) as code,
    ml.district as name,
    sr.id as parent_id,
    jsonb_build_object(
        'type', 'district',
        'state_name', ml.state,
        'country_name', ml.country,
        'pincode_count', COUNT(DISTINCT ml.pincode) FILTER (WHERE ml.pincode IS NOT NULL)
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    MIN(ml.created_at) as created_at,
    MAX(COALESCE(ml.updated_at, ml.created_at)) as updated_at
FROM master_locations ml
JOIN state_refs sr ON sr.name = ml.state AND sr.country_name = ml.country
WHERE ml.district IS NOT NULL AND TRIM(ml.district) != ''
GROUP BY ml.district, ml.state, ml.country, ml.status, sr.id
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Progress check
SELECT 
    category,
    COUNT(*) as migrated_count
FROM master_reference_data 
GROUP BY category 
ORDER BY category;