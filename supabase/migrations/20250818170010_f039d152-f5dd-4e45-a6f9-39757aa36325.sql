-- Fix Critical RLS Security Issues

-- Enable RLS on master_reference_data (the target table from migration)
ALTER TABLE master_reference_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_reference_data
CREATE POLICY "Allow authenticated users to read master reference data" 
ON master_reference_data FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage master reference data" 
ON master_reference_data FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Enable RLS on key master tables that don't have it
ALTER TABLE master_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_vehicle_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_vehicle_types ENABLE ROW LEVEL SECURITY;

-- Create policies for master_cities
CREATE POLICY "Allow authenticated users to read cities" 
ON master_cities FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage cities" 
ON master_cities FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Create policies for master_pincodes
CREATE POLICY "Allow authenticated users to read pincodes" 
ON master_pincodes FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage pincodes" 
ON master_pincodes FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Create policies for master_vehicle_data
CREATE POLICY "Allow authenticated users to read vehicle data" 
ON master_vehicle_data FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage vehicle data" 
ON master_vehicle_data FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Create policies for master_vehicle_types
CREATE POLICY "Allow authenticated users to read vehicle types" 
ON master_vehicle_types FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage vehicle types" 
ON master_vehicle_types FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));