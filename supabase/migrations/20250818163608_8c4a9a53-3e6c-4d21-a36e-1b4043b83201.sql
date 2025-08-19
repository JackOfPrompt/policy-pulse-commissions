-- ============================================================================
-- EXECUTING PHASE 2: DATA MIGRATION 
-- Migrating 20k+ records from old schema to optimized structure
-- ============================================================================

-- Create temporary logging for progress tracking
CREATE TEMP TABLE IF NOT EXISTS migration_log (
    step_name TEXT,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    rows_processed INTEGER,
    status TEXT DEFAULT 'IN_PROGRESS'
);

-- ===========================================
-- STEP 1: Master Reference Data Migration
-- ===========================================

-- Insert initial log entries
INSERT INTO migration_log (step_name) VALUES 
('Master Countries'), ('Master States'), ('Master Districts'), 
('Master Departments'), ('Master Occupations');

-- Migrate countries from master_locations
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'country' as category,
    LEFT(UPPER(country), 3) as code,
    country as name,
    jsonb_build_object('type', 'country', 'iso_code', LEFT(UPPER(country), 3)) as metadata,
    NULL as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    MIN(created_at) as created_at,
    MAX(updated_at) as updated_at
FROM master_locations 
WHERE country IS NOT NULL AND TRIM(country) != ''
GROUP BY country, status;

-- Update log for countries
UPDATE migration_log SET 
    end_time = now(), 
    rows_processed = (SELECT COUNT(DISTINCT country) FROM master_locations WHERE country IS NOT NULL),
    status = 'COMPLETED'
WHERE step_name = 'Master Countries';

-- Migrate states
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
    NULL as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    MIN(ml.created_at) as created_at,
    MAX(ml.updated_at) as updated_at
FROM master_locations ml
JOIN country_refs cr ON cr.name = ml.country
WHERE ml.state IS NOT NULL AND TRIM(ml.state) != ''
GROUP BY ml.state, ml.country, ml.status, cr.id;