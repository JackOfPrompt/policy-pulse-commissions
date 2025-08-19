-- Continue migration with proper UUID handling

-- Update log for states
UPDATE migration_log SET 
    end_time = now(), 
    rows_processed = (SELECT COUNT(DISTINCT state) FROM master_locations WHERE state IS NOT NULL),
    status = 'COMPLETED'
WHERE step_name = 'Master States';

-- Migrate districts with proper UUID casting
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
    MAX(ml.updated_at) as updated_at
FROM master_locations ml
JOIN state_refs sr ON sr.name = ml.state AND sr.country_name = ml.country
WHERE ml.district IS NOT NULL AND TRIM(ml.district) != ''
GROUP BY ml.district, ml.state, ml.country, ml.status, sr.id;

-- Update log for districts
UPDATE migration_log SET 
    end_time = now(), 
    rows_processed = (SELECT COUNT(DISTINCT district) FROM master_locations WHERE district IS NOT NULL),
    status = 'COMPLETED'
WHERE step_name = 'Master Districts';