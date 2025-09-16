-- Create providers master table for normalized provider data
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,           -- canonical name (e.g., "Tata AIG General Insurance Co. Ltd.")
  short_name text,                     -- optional (e.g., "TATA AIG")
  code text UNIQUE,                    -- unique code for the provider
  aliases text[] DEFAULT '{}',         -- store variations like ["TATA-AIG", "Tata AIG Insurance"]
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add provider_id to policies table
ALTER TABLE policies ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);

-- Add provider_id and product_type_id to all payout grid tables
ALTER TABLE life_payout_grid ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);
ALTER TABLE motor_payout_grid ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id); 
ALTER TABLE health_payout_grid ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);

-- Add product_type_id to payout grids (they should reference product_types table)
ALTER TABLE life_payout_grid ADD COLUMN IF NOT EXISTS product_type_id uuid REFERENCES product_types(id);
ALTER TABLE motor_payout_grid ADD COLUMN IF NOT EXISTS product_type_id uuid REFERENCES product_types(id);
ALTER TABLE health_payout_grid ADD COLUMN IF NOT EXISTS product_type_id uuid REFERENCES product_types(id);

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

-- Create function to update comprehensive commission calculation with normalized data
CREATE OR REPLACE FUNCTION calculate_comprehensive_commission_report_normalized(
  p_org_id uuid DEFAULT NULL,
  p_policy_id uuid DEFAULT NULL
)
RETURNS TABLE(
  policy_id uuid,
  policy_number text,
  product_category text,
  product_name text,
  plan_name text,
  provider text,
  source_type text,
  grid_table text,
  grid_id uuid,
  commission_rate numeric,
  reward_rate numeric,
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  broker_share numeric,
  calc_date timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH base AS (
  SELECT 
    p.id AS policy_id,
    p.org_id,
    p.policy_number,
    pt.category AS product_category,
    pt.name AS product_name,
    p.plan_name,
    pr.name AS provider,
    p.source_type,
    p.agent_id,
    p.misp_id,
    p.employee_id,
    p.provider_id,
    p.product_type_id,
    COALESCE(p.premium_with_gst, p.premium_without_gst, 0) AS premium_amount
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  LEFT JOIN providers pr ON pr.id = p.provider_id
  WHERE p.policy_status = 'active'
    AND (p_org_id IS NULL OR p.org_id = p_org_id)
    AND (p_policy_id IS NULL OR p.id = p_policy_id)
),
grid_match AS (
  -- Life using normalized foreign keys
  SELECT 
    b.policy_id,
    lpg.id AS grid_id,
    'life_payout_grid' AS grid_table,
    lpg.commission_rate,
    COALESCE(lpg.reward_rate, 0) AS reward_rate,
    b.premium_amount,
    b.source_type,
    b.agent_id,
    b.misp_id,
    b.employee_id
  FROM base b
  JOIN life_payout_grid lpg 
    ON lpg.org_id = b.org_id
   AND lpg.provider_id = b.provider_id
   AND lpg.product_type_id = b.product_type_id
   AND (b.premium_amount BETWEEN COALESCE(lpg.premium_start_price,0) AND COALESCE(lpg.premium_end_price,99999999))
   AND lpg.is_active = true
   AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
  WHERE b.product_category = 'life'

  UNION ALL
  -- Health using normalized foreign keys
  SELECT 
    b.policy_id,
    hpg.id AS grid_id,
    'health_payout_grid' AS grid_table,
    hpg.commission_rate,
    COALESCE(hpg.reward_rate, 0) AS reward_rate,
    b.premium_amount,
    b.source_type,
    b.agent_id,
    b.misp_id,
    b.employee_id
  FROM base b
  JOIN health_payout_grid hpg
    ON hpg.org_id = b.org_id
   AND hpg.provider_id = b.provider_id
   AND hpg.product_type_id = b.product_type_id
   AND hpg.is_active = true
   AND CURRENT_DATE BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, CURRENT_DATE)
  WHERE b.product_category = 'health'

  UNION ALL
  -- Motor using normalized foreign keys
  SELECT 
    b.policy_id,
    mpg.id AS grid_id,
    'motor_payout_grid' AS grid_table,
    mpg.commission_rate,
    COALESCE(mpg.reward_rate, 0) AS reward_rate,
    b.premium_amount,
    b.source_type,
    b.agent_id,
    b.misp_id,
    b.employee_id
  FROM base b
  JOIN motor_payout_grid mpg
    ON mpg.org_id = b.org_id
   AND mpg.provider_id = b.provider_id
   AND mpg.product_type_id = b.product_type_id
   AND mpg.is_active = true
   AND CURRENT_DATE BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, CURRENT_DATE)
  WHERE b.product_category = 'motor'
)
SELECT 
  b.policy_id,
  b.policy_number,
  b.product_category,
  b.product_name,
  b.plan_name,
  b.provider,
  b.source_type,
  g.grid_table,
  g.grid_id,
  g.commission_rate,
  g.reward_rate,
  (b.premium_amount * g.commission_rate/100) AS insurer_commission,
  CASE 
    WHEN b.source_type = 'agent' AND g.agent_id IS NOT NULL THEN 
      (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM agents WHERE id = g.agent_id), 70)/100
    ELSE 0
  END AS agent_commission,
  CASE 
    WHEN b.source_type = 'misp' AND g.misp_id IS NOT NULL THEN 
      (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM misps WHERE id = g.misp_id), 50)/100
    ELSE 0
  END AS misp_commission,
  CASE 
    WHEN b.source_type = 'employee' AND g.employee_id IS NOT NULL THEN 
      (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT employee_share_percentage FROM org_config WHERE org_id = b.org_id), 60)/100
    ELSE 0
  END AS employee_commission,
  -- Broker share = leftover after agent/misp/employee commission
  (b.premium_amount * g.commission_rate/100) - (
    CASE 
      WHEN b.source_type = 'agent' AND g.agent_id IS NOT NULL THEN 
        (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM agents WHERE id = g.agent_id), 70)/100
      WHEN b.source_type = 'misp' AND g.misp_id IS NOT NULL THEN 
        (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM misps WHERE id = g.misp_id), 50)/100
      WHEN b.source_type = 'employee' AND g.employee_id IS NOT NULL THEN 
        (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT employee_share_percentage FROM org_config WHERE org_id = b.org_id), 60)/100
      ELSE 0
    END
  ) AS broker_share,
  now()::timestamp AS calc_date
FROM base b
JOIN grid_match g ON g.policy_id = b.policy_id;
$$;

-- Update the sync function to use normalized calculation
CREATE OR REPLACE FUNCTION sync_comprehensive_commissions_normalized(p_org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  commission_rec RECORD;
BEGIN
  -- Get current user's org if not provided
  IF p_org_id IS NULL THEN
    SELECT org_id INTO p_org_id
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    LIMIT 1;
  END IF;

  -- Insert/update commission records using normalized calculation
  FOR commission_rec IN 
    SELECT * FROM calculate_comprehensive_commission_report_normalized(p_org_id)
  LOOP
    INSERT INTO policy_commissions (
      policy_id,
      org_id,
      product_type,
      grid_table,
      grid_id,
      commission_rate,
      reward_rate,
      commission_amount,
      reward_amount,
      total_amount,
      insurer_commission,
      agent_commission,
      misp_commission,
      employee_commission,
      broker_share,
      commission_status,
      calc_date
    )
    VALUES (
      commission_rec.policy_id,
      p_org_id,
      commission_rec.product_category,
      commission_rec.grid_table,
      commission_rec.grid_id,
      commission_rec.commission_rate,
      commission_rec.reward_rate,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission * commission_rec.reward_rate / 100,
      commission_rec.insurer_commission + (commission_rec.insurer_commission * commission_rec.reward_rate / 100),
      commission_rec.insurer_commission,
      commission_rec.agent_commission,
      commission_rec.misp_commission,
      commission_rec.employee_commission,
      commission_rec.broker_share,
      'calculated',
      commission_rec.calc_date
    )
    ON CONFLICT (policy_id) 
    WHERE is_active = true
    DO UPDATE SET
      commission_rate = EXCLUDED.commission_rate,
      reward_rate = EXCLUDED.reward_rate,
      commission_amount = EXCLUDED.commission_amount,
      reward_amount = EXCLUDED.reward_amount,
      total_amount = EXCLUDED.total_amount,
      insurer_commission = EXCLUDED.insurer_commission,
      agent_commission = EXCLUDED.agent_commission,
      misp_commission = EXCLUDED.misp_commission,
      employee_commission = EXCLUDED.employee_commission,
      broker_share = EXCLUDED.broker_share,
      grid_table = EXCLUDED.grid_table,
      grid_id = EXCLUDED.grid_id,
      commission_status = 'calculated',
      calc_date = EXCLUDED.calc_date,
      updated_at = NOW();
  END LOOP;
END;
$$;

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