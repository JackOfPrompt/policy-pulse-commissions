-- Remove country_code column from master_insurance_providers table
ALTER TABLE public.master_insurance_providers 
DROP COLUMN IF EXISTS country_code;