-- Insert sample providers data
INSERT INTO providers (name, short_name, code, aliases) VALUES
('Tata AIG General Insurance Co. Ltd.', 'Tata AIG', 'TATA_AIG', '["TATA AIG", "Tata AIG General Insurance", "TATA-AIG"]'),
('HDFC Life Insurance Co. Ltd.', 'HDFC Life', 'HDFC_LIFE', '["HDFC Life", "HDFC LIFE", "HDFC Life Insurance"]'),
('ICICI Lombard General Insurance Co. Ltd.', 'ICICI Lombard', 'ICICI_LOMBARD', '["ICICI Lombard", "ICICI LOMBARD", "ICICI Lombard General Insurance"]'),
('Bajaj Allianz General Insurance Co. Ltd.', 'Bajaj Allianz', 'BAJAJ_ALLIANZ', '["Bajaj Allianz", "BAJAJ ALLIANZ", "Bajaj Allianz General Insurance"]'),
('Star Health and Allied Insurance Co. Ltd.', 'Star Health', 'STAR_HEALTH', '["Star Health", "STAR HEALTH", "Star Health Insurance"]'),
('New India Assurance Co. Ltd.', 'New India Assurance', 'NEW_INDIA', '["New India Assurance", "NEW INDIA", "New India Insurance"]'),
('Life Insurance Corporation of India', 'LIC', 'LIC', '["LIC", "Life Insurance Corporation", "LIC of India"]')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for providers table
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view providers" ON providers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage providers" ON providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Add updated_at trigger for providers
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_provider_id ON policies(provider_id);
CREATE INDEX IF NOT EXISTS idx_policies_product_type_id ON policies(product_type_id);
CREATE INDEX IF NOT EXISTS idx_life_payout_grid_provider_id ON life_payout_grid(provider_id);
CREATE INDEX IF NOT EXISTS idx_life_payout_grid_product_type_id ON life_payout_grid(product_type_id);
CREATE INDEX IF NOT EXISTS idx_health_payout_grid_provider_id ON health_payout_grid(provider_id);
CREATE INDEX IF NOT EXISTS idx_health_payout_grid_product_type_id ON health_payout_grid(product_type_id);
CREATE INDEX IF NOT EXISTS idx_motor_payout_grid_provider_id ON motor_payout_grid(provider_id);
CREATE INDEX IF NOT EXISTS idx_motor_payout_grid_product_type_id ON motor_payout_grid(product_type_id);