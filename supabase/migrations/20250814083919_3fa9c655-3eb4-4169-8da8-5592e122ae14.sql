-- Consolidate master tables into new simplified structure
-- New structure: District, Division, Region, Block, State, Country, Pincode

-- Create the new consolidated master_locations table
CREATE TABLE public.master_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  district TEXT,
  division TEXT,
  region TEXT,
  block TEXT,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  pincode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Ensure unique pincode
  CONSTRAINT unique_pincode UNIQUE (pincode)
);

-- Enable RLS
ALTER TABLE public.master_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read master locations" 
ON public.master_locations 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage master locations" 
ON public.master_locations 
FOR ALL 
USING (EXISTS (
  SELECT 1
  FROM profiles
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'system_admin'::app_role
));

-- Migrate existing data from the consolidated tables
-- First, create a temporary staging table to combine all location data
CREATE TEMP TABLE location_staging AS
SELECT DISTINCT
  COALESCE(c.city_name, 'Unknown') as district,
  NULL as division,
  NULL as region,
  NULL as block,
  COALESCE(s.state_name, 'Unknown') as state,
  COALESCE(co.country_name, 'India') as country,
  p.pincode,
  CASE 
    WHEN p.status::text = 'Active' AND c.status::text = 'Active' AND s.status::text = 'Active' 
    THEN 'Active' 
    ELSE 'Inactive' 
  END as status,
  p.created_at,
  p.updated_at,
  p.created_by,
  p.updated_by
FROM master_pincodes p
LEFT JOIN master_cities c ON p.city_id = c.city_id
LEFT JOIN master_states s ON c.state_id = s.state_id
LEFT JOIN master_countries co ON s.country_code = co.country_code
WHERE p.pincode IS NOT NULL AND p.pincode != '';

-- Insert the migrated data
INSERT INTO public.master_locations (
  district, division, region, block, state, country, pincode, 
  status, created_at, updated_at, created_by, updated_by
)
SELECT 
  district, division, region, block, state, country, pincode,
  status, created_at, updated_at, created_by, updated_by
FROM location_staging
ON CONFLICT (pincode) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_master_locations_pincode ON public.master_locations(pincode);
CREATE INDEX idx_master_locations_state ON public.master_locations(state);
CREATE INDEX idx_master_locations_country ON public.master_locations(country);
CREATE INDEX idx_master_locations_status ON public.master_locations(status);
CREATE INDEX idx_master_locations_district ON public.master_locations(district);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_master_locations_updated_at
  BEFORE UPDATE ON public.master_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- After successful migration, we'll keep the old tables for now for safety
-- They can be dropped later after confirming everything works correctly

-- Create a view for backward compatibility if needed
CREATE OR REPLACE VIEW master_pincodes_view AS
SELECT 
  gen_random_uuid() as pincode_id,
  pincode,
  district as area_name,
  gen_random_uuid() as city_id,
  NULL::numeric as latitude,
  NULL::numeric as longitude,
  CASE status WHEN 'Active' THEN 'Active'::location_status ELSE 'Inactive'::location_status END as status,
  created_at,
  updated_at,
  created_by,
  updated_by
FROM master_locations;

CREATE OR REPLACE VIEW master_cities_view AS
SELECT DISTINCT
  gen_random_uuid() as city_id,
  LEFT(district, 10) as city_code,
  district as city_name,
  gen_random_uuid() as state_id,
  LEFT(state, 3) as state_code,
  state as state_name,
  LEFT(country, 1) as country_code,
  CASE status WHEN 'Active' THEN 'Active'::location_status ELSE 'Inactive'::location_status END as status,
  created_at,
  updated_at,
  created_by,
  updated_by,
  country as country_name
FROM master_locations;