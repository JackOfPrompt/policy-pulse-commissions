-- Master Reference Data Consolidation (Steps 1-7)

-- Migrate master_locations → master_reference_data
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'country' as category,
    LEFT(country, 3) as code,
    country as name,
    NULL as parent_id,
    jsonb_build_object('type', 'country') as metadata,
    NULL as tenant_id, -- Global reference
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_locations 
WHERE country IS NOT NULL
GROUP BY country, status, created_at, updated_at
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Insert states with country as parent
WITH country_mapping AS (
    SELECT id, name as country_name 
    FROM master_reference_data 
    WHERE category = 'country'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'state' as category,
    LEFT(ml.state, 3) as code,
    ml.state as name,
    cm.id as parent_id,
    jsonb_build_object('type', 'state', 'country_code', LEFT(ml.country, 3)) as metadata,
    NULL as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    ml.created_at,
    ml.updated_at
FROM master_locations ml
JOIN country_mapping cm ON cm.country_name = ml.country
WHERE ml.state IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Insert districts/cities with state as parent
WITH state_mapping AS (
    SELECT id, name as state_name, 
           (metadata->>'country_code') as country_code
    FROM master_reference_data 
    WHERE category = 'state'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'district' as category,
    LEFT(ml.district, 10) as code,
    ml.district as name,
    sm.id as parent_id,
    jsonb_build_object(
        'type', 'district',
        'state_name', ml.state,
        'country_name', ml.country,
        'pincode', ml.pincode
    ) as metadata,
    NULL as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    ml.created_at,
    ml.updated_at
FROM master_locations ml
JOIN state_mapping sm ON sm.state_name = ml.state
WHERE ml.district IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;