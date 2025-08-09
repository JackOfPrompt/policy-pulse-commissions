-- Remove duplicate providers
-- Step 1: Identify duplicates based on provider_name (case-insensitive) and keep the most recent one

WITH duplicate_providers AS (
  SELECT 
    id,
    provider_name,
    irdai_code,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(provider_name)), COALESCE(LOWER(TRIM(irdai_code)), '') 
      ORDER BY created_at DESC, updated_at DESC
    ) as rn
  FROM insurance_providers
),
providers_to_delete AS (
  SELECT id 
  FROM duplicate_providers 
  WHERE rn > 1
)
DELETE FROM insurance_providers 
WHERE id IN (SELECT id FROM providers_to_delete);

-- Step 2: Add unique constraint on provider_name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_unique_name 
ON insurance_providers (LOWER(TRIM(provider_name)));

-- Step 3: Add unique constraint on irdai_code (case-insensitive, excluding nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_unique_irdai_code 
ON insurance_providers (LOWER(TRIM(irdai_code))) 
WHERE irdai_code IS NOT NULL AND TRIM(irdai_code) != '';

-- Step 4: Update any remaining null or empty IRDAI codes to ensure data consistency
UPDATE insurance_providers 
SET irdai_code = NULL 
WHERE irdai_code IS NOT NULL AND TRIM(irdai_code) = '';

-- Step 5: Create audit log entry for the cleanup
INSERT INTO audit_logs (
  event,
  entity_type,
  entity_id,
  reason,
  metadata
) VALUES (
  'Duplicate Providers Cleanup',
  'provider',
  gen_random_uuid(),
  'Removed duplicate provider entries and added unique constraints',
  jsonb_build_object(
    'cleanup_date', now(),
    'performed_by', 'system_migration'
  )
);