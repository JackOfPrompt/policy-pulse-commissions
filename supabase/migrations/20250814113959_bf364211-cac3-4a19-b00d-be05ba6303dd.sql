-- Remove duplicate insurance providers, keeping only the oldest entry for each IRDA license number
DELETE FROM master_insurance_providers 
WHERE provider_id NOT IN (
    SELECT MIN(provider_id) 
    FROM master_insurance_providers 
    GROUP BY irda_license_number
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE master_insurance_providers 
ADD CONSTRAINT unique_irda_license_number UNIQUE (irda_license_number);