-- Add missing columns to master_cities to match the consolidated structure
ALTER TABLE master_cities ADD COLUMN IF NOT EXISTS city_code text;
ALTER TABLE master_cities ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE master_cities ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Create unique constraint on city_code if it doesn't exist
ALTER TABLE master_cities ADD CONSTRAINT master_cities_city_code_unique UNIQUE (city_code);

-- Update master_cities with data from master_cities_new
UPDATE master_cities 
SET 
  city_code = mcn.city_code,
  city_name = mcn.city_name,
  state_name = mcn.state_name,
  country_code = mcn.country_code,
  status = mcn.status,
  created_by = mcn.created_by,
  updated_by = mcn.updated_by,
  created_at = mcn.created_at,
  updated_at = mcn.updated_at
FROM master_cities_new mcn
WHERE master_cities.city_id = mcn.city_id;

-- Insert new cities from master_cities_new that don't exist in master_cities
INSERT INTO master_cities (city_id, city_code, city_name, state_id, country_code, status, created_at, updated_at, created_by, updated_by)
SELECT city_id, city_code, city_name, state_id, country_code, status, created_at, updated_at, created_by, updated_by
FROM master_cities_new mcn
WHERE NOT EXISTS (SELECT 1 FROM master_cities mc WHERE mc.city_id = mcn.city_id);

-- Create trigger for automatic timestamp updates on master_cities
DROP TRIGGER IF EXISTS update_master_cities_updated_at ON master_cities;
CREATE TRIGGER update_master_cities_updated_at
  BEFORE UPDATE ON public.master_cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-deactivate pincodes when city is deactivated
CREATE OR REPLACE FUNCTION public.auto_deactivate_pincodes()
RETURNS TRIGGER AS $$
BEGIN
  -- If city status changes to Inactive, deactivate all linked pincodes
  IF NEW.status = 'Inactive' AND OLD.status = 'Active' THEN
    UPDATE master_pincodes 
    SET status = 'Inactive', updated_at = now()
    WHERE city_id = NEW.city_id AND status = 'Active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-deactivating pincodes
DROP TRIGGER IF EXISTS auto_deactivate_pincodes_trigger ON master_cities;
CREATE TRIGGER auto_deactivate_pincodes_trigger
  AFTER UPDATE ON public.master_cities
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_deactivate_pincodes();

-- Drop the old master_cities_new table
DROP TABLE IF EXISTS master_cities_new CASCADE;