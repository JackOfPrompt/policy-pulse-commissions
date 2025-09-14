-- Create reference tables for normalization
CREATE TABLE vehicle_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE business_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE fuel_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE coverage_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT, -- motor, health, etc.
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert sample reference data
INSERT INTO vehicle_types (code, name) VALUES
('car', 'Car'),
('bike', 'Bike'),
('truck', 'Truck'),
('bus', 'Bus');

INSERT INTO business_types (code, name) VALUES
('new', 'New Business'),
('renewal', 'Renewal'),
('rollover', 'Rollover');

INSERT INTO fuel_types (code, name) VALUES
('petrol', 'Petrol'),
('diesel', 'Diesel'),
('cng', 'CNG'),
('electric', 'Electric');

INSERT INTO coverage_types (code, name, category) VALUES
('comprehensive', 'Comprehensive', 'motor'),
('third_party', 'Third Party', 'motor'),
('individual', 'Individual', 'health'),
('family', 'Family Floater', 'health');

-- Create improved motor payout grid table
CREATE TABLE motor_payout_grid (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  product_subtype TEXT NOT NULL,
  vehicle_type_id INTEGER REFERENCES vehicle_types(id),
  business_type_id INTEGER REFERENCES business_types(id),
  fuel_type_id INTEGER REFERENCES fuel_types(id),
  rto_location TEXT,
  vehicle_make TEXT,
  gvw_range TEXT,
  cc_range TEXT,
  pcv_type TEXT,
  mcv_type TEXT,
  provider TEXT NOT NULL,
  ncb_percentage INTEGER,
  coverage_type_id INTEGER REFERENCES coverage_types(id),
  gwp_slab TEXT,
  commission_rate DECIMAL(5,2) NOT NULL,
  reward_rate DECIMAL(5,2) DEFAULT 0,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT unique_motor_payout_record UNIQUE (
    org_id, product_type, product_subtype, vehicle_type_id, business_type_id, 
    fuel_type_id, rto_location, vehicle_make, gvw_range, cc_range, 
    pcv_type, mcv_type, provider, ncb_percentage, coverage_type_id, 
    gwp_slab, valid_from
  )
);

-- Create improved health payout grid table
CREATE TABLE health_payout_grid (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  product_sub_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  sum_insured_min INTEGER,
  sum_insured_max INTEGER,
  age_group TEXT,
  family_size INTEGER,
  commission_rate DECIMAL(5,2) NOT NULL,
  reward_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT unique_health_payout_record UNIQUE (
    org_id, product_type, product_sub_type, provider, plan_name, 
    sum_insured_min, sum_insured_max, age_group, family_size, valid_from
  )
);

-- Enable RLS on all tables
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_payout_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_payout_grid ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reference tables (globally readable)
CREATE POLICY "Reference tables are viewable by all authenticated users" ON vehicle_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Reference tables are viewable by all authenticated users" ON business_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Reference tables are viewable by all authenticated users" ON fuel_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Reference tables are viewable by all authenticated users" ON coverage_types FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for payout grids (org-based)
CREATE POLICY "Users can view their organization's motor payout grid" ON motor_payout_grid 
FOR SELECT USING (
  org_id IN (
    SELECT user_organizations.org_id 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their organization's motor payout grid" ON motor_payout_grid 
FOR ALL USING (
  org_id IN (
    SELECT user_organizations.org_id 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their organization's health payout grid" ON health_payout_grid 
FOR SELECT USING (
  org_id IN (
    SELECT user_organizations.org_id 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their organization's health payout grid" ON health_payout_grid 
FOR ALL USING (
  org_id IN (
    SELECT user_organizations.org_id 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_motor_payout_grid_updated_at
  BEFORE UPDATE ON motor_payout_grid
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_payout_grid_updated_at
  BEFORE UPDATE ON health_payout_grid
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();