-- Remove city_id column from master_insurance_providers table
ALTER TABLE public.master_insurance_providers 
DROP COLUMN IF EXISTS city_id;