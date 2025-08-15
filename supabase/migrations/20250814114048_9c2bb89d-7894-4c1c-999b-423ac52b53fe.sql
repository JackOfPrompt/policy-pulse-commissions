-- Remove duplicate insurance providers, keeping only the first entry for each IRDA license number
WITH duplicates AS (
    SELECT provider_id,
           ROW_NUMBER() OVER (
               PARTITION BY irda_license_number 
               ORDER BY created_at ASC
           ) as rn
    FROM master_insurance_providers
)
DELETE FROM master_insurance_providers 
WHERE provider_id IN (
    SELECT provider_id 
    FROM duplicates 
    WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE master_insurance_providers 
ADD CONSTRAINT unique_irda_license_number UNIQUE (irda_license_number);