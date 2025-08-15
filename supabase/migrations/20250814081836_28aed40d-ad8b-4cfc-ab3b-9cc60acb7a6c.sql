-- First, migrate data from master_cities_new to existing master_cities
INSERT INTO public.master_cities (city_code, city_name, state_id, country_code, status, created_at, updated_at, created_by, updated_by)
SELECT city_code, city_name, state_id, country_code, status, created_at, updated_at, created_by, updated_by
FROM master_cities_new
ON CONFLICT (city_code) DO UPDATE SET
  city_name = EXCLUDED.city_name,
  state_id = EXCLUDED.state_id,
  country_code = EXCLUDED.country_code,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at,
  updated_by = EXCLUDED.updated_by;

-- Update pincodes to reference the correct city_id from the consolidated table
UPDATE master_pincodes 
SET city_id = (
  SELECT mc.city_id 
  FROM master_cities mc 
  JOIN master_cities_new mcn ON mc.city_code = mcn.city_code 
  WHERE mcn.city_id = master_pincodes.city_id
)
WHERE EXISTS (
  SELECT 1 
  FROM master_cities_new mcn 
  WHERE mcn.city_id = master_pincodes.city_id
);

-- Create trigger for automatic timestamp updates on master_cities
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
CREATE TRIGGER auto_deactivate_pincodes_trigger
  AFTER UPDATE ON public.master_cities
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_deactivate_pincodes();

-- Drop the old master_cities_new table
DROP TABLE IF EXISTS master_cities_new CASCADE;