-- Drop old tables and create consolidated master tables structure
DROP TABLE IF EXISTS master_cities CASCADE;
DROP TABLE IF EXISTS provider_lob_map CASCADE;

-- Create consolidated master_cities table with proper foreign keys
CREATE TABLE public.master_cities (
  city_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_code text UNIQUE NOT NULL,
  city_name text NOT NULL,
  state_id uuid NOT NULL REFERENCES master_states(state_id),
  country_code char(3) NOT NULL REFERENCES master_countries(country_code),
  status location_status NOT NULL DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Enable RLS on master_cities
ALTER TABLE public.master_cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_cities
CREATE POLICY "Allow authenticated users to read cities" ON public.master_cities
  FOR SELECT USING (true);

CREATE POLICY "System admins can manage cities" ON public.master_cities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'system_admin'
    )
  );

-- Update master_pincodes to reference the new cities table
ALTER TABLE public.master_pincodes 
  DROP CONSTRAINT IF EXISTS master_pincodes_city_id_fkey;

ALTER TABLE public.master_pincodes 
  ADD CONSTRAINT master_pincodes_city_id_fkey 
  FOREIGN KEY (city_id) REFERENCES master_cities(city_id);

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

-- Migrate data from master_cities_new to master_cities
INSERT INTO public.master_cities (city_code, city_name, state_id, country_code, status, created_at, updated_at, created_by, updated_by)
SELECT city_code, city_name, state_id, country_code, status, created_at, updated_at, created_by, updated_by
FROM master_cities_new
ON CONFLICT (city_code) DO NOTHING;

-- Drop the old master_cities_new table
DROP TABLE IF EXISTS master_cities_new CASCADE;