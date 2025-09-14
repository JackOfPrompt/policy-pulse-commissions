-- Create life payout grid table with improvements
CREATE TABLE life_payout_grid (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  product_type TEXT NOT NULL,
  product_sub_type TEXT,
  provider TEXT NOT NULL,
  plan_type TEXT,
  plan_name TEXT,
  
  -- Premium payment term and policy term
  ppt INTEGER, -- premium payment term (years)
  pt INTEGER,  -- policy term (years)
  
  -- Premium slab ranges
  premium_start_price DECIMAL(12,2),
  premium_end_price DECIMAL(12,2),
  
  -- Commission structure
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  commission_end_date DATE,
  
  -- Reward/variable structure
  reward_rate DECIMAL(5,2) DEFAULT 0,
  variable_start_date DATE,
  variable_end_date DATE,
  
  -- Total calculated rate
  total_rate DECIMAL(5,2),
  
  -- Audit and control fields
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Unique constraint to prevent conflicting entries
  CONSTRAINT unique_life_payout_record UNIQUE (
    org_id, product_type, product_sub_type, provider, plan_type, plan_name, 
    ppt, pt, premium_start_price, premium_end_price, commission_start_date
  )
);

-- Enable RLS on life payout grid
ALTER TABLE life_payout_grid ENABLE ROW LEVEL SECURITY;

-- RLS Policies for life payout grid (org-based)
CREATE POLICY "Users can view their organization's life payout grid" ON life_payout_grid 
FOR SELECT USING (
  org_id IN (
    SELECT user_organizations.org_id 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their organization's life payout grid" ON life_payout_grid 
FOR ALL USING (
  org_id IN (
    SELECT user_organizations.org_id 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_life_payout_grid_updated_at
  BEFORE UPDATE ON life_payout_grid
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate total_rate automatically
CREATE OR REPLACE FUNCTION calculate_life_total_rate()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_rate = COALESCE(NEW.commission_rate, 0) + COALESCE(NEW.reward_rate, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate total_rate
CREATE TRIGGER calculate_life_total_rate_trigger
  BEFORE INSERT OR UPDATE ON life_payout_grid
  FOR EACH ROW
  EXECUTE FUNCTION calculate_life_total_rate();

-- Add some sample life insurance reference data
INSERT INTO coverage_types (code, name, category) VALUES
('term', 'Term Life', 'life'),
('endowment', 'Endowment', 'life'),
('ulip', 'Unit Linked', 'life'),
('whole_life', 'Whole Life', 'life')
ON CONFLICT (code) DO NOTHING;