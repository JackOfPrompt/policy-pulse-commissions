-- Remove duplicate providers step by step
-- Step 1: Create a temporary table with the providers to keep (most recent ones)
CREATE TEMPORARY TABLE providers_to_keep AS
WITH ranked_providers AS (
  SELECT 
    id,
    provider_name,
    irdai_code,
    created_at,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(provider_name))
      ORDER BY 
        CASE WHEN irdai_code IS NOT NULL AND TRIM(irdai_code) != '' THEN 0 ELSE 1 END,
        updated_at DESC NULLS LAST,
        created_at DESC
    ) as rn
  FROM insurance_providers
)
SELECT id 
FROM ranked_providers 
WHERE rn = 1;

-- Step 2: Delete duplicates (keep only the providers in our keep list)
DELETE FROM insurance_providers 
WHERE id NOT IN (SELECT id FROM providers_to_keep);

-- Step 3: Clean up any empty IRDAI codes
UPDATE insurance_providers 
SET irdai_code = NULL 
WHERE irdai_code IS NOT NULL AND TRIM(irdai_code) = '';

-- Step 4: Now add the unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_unique_name 
ON insurance_providers (LOWER(TRIM(provider_name)));

-- Step 5: Add unique constraint on irdai_code (excluding nulls and empty strings)
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_unique_irdai_code 
ON insurance_providers (LOWER(TRIM(irdai_code))) 
WHERE irdai_code IS NOT NULL AND TRIM(irdai_code) != '';

-- Step 6: Log the cleanup
INSERT INTO audit_logs (
  event,
  entity_type,
  entity_id,
  reason,
  metadata
) VALUES (
  'Provider Duplicates Removed',
  'provider',
  gen_random_uuid(),
  'Removed duplicate provider entries and added unique constraints to prevent future duplicates',
  jsonb_build_object(
    'cleanup_date', now(),
    'performed_by', 'admin_cleanup'
  )
);