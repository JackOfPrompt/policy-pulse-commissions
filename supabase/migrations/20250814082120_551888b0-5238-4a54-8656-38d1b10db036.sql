-- Fix the schema and consolidate tables properly
-- First, add missing columns and constraints to master_cities
ALTER TABLE master_cities 
  ADD COLUMN IF NOT EXISTS state_id uuid,
  ADD COLUMN IF NOT EXISTS status location_status DEFAULT 'Active',
  DROP COLUMN IF EXISTS state_code,
  DROP COLUMN IF EXISTS state_name,
  DROP COLUMN IF EXISTS is_active;

-- Add foreign key constraints
ALTER TABLE master_cities 
  ADD CONSTRAINT master_cities_state_id_fkey 
  FOREIGN KEY (state_id) REFERENCES master_states(state_id);

-- Update master_cities with data from master_cities_new
UPDATE master_cities 
SET 
  city_code = mcn.city_code,
  city_name = mcn.city_name,
  state_id = mcn.state_id,
  country_code = mcn.country_code::char(3),
  status = mcn.status,
  created_by = mcn.created_by,
  updated_by = mcn.updated_by,
  created_at = mcn.created_at,
  updated_at = mcn.updated_at
FROM master_cities_new mcn
WHERE master_cities.city_id = mcn.city_id;

-- Insert new cities from master_cities_new that don't exist in master_cities
INSERT INTO master_cities (city_id, city_code, city_name, state_id, country_code, status, created_at, updated_at, created_by, updated_by)
SELECT city_id, city_code, city_name, state_id, country_code::char(3), status, created_at, updated_at, created_by, updated_by
FROM master_cities_new mcn
WHERE NOT EXISTS (SELECT 1 FROM master_cities mc WHERE mc.city_id = mcn.city_id);

-- Drop the old master_cities_new table
DROP TABLE IF EXISTS master_cities_new CASCADE;