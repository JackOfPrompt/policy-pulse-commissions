-- Commission grid by product & sub-type
CREATE TABLE IF NOT EXISTS commission_grids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_type TEXT CHECK (product_type IN ('life','health','motor')) NOT NULL,
  product_subtype TEXT, -- e.g., term, whole-life, floater, comprehensive
  min_premium NUMERIC,
  max_premium NUMERIC,
  commission_rate NUMERIC(5,2) NOT NULL, -- %
  effective_from DATE DEFAULT NOW(),
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE commission_grids ENABLE ROW LEVEL SECURITY;

-- RLS policies for commission_grids
CREATE POLICY "Users can manage their organization's commission grids" ON commission_grids
  FOR ALL USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their organization's commission grids" ON commission_grids
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Policy-wise calculated commissions (enhance existing table structure)
-- Note: We already have policy_commissions table, let's add the new columns
ALTER TABLE policy_commissions 
ADD COLUMN IF NOT EXISTS insurer_commission NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS agent_commission NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS misp_commission NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS employee_commission NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS broker_share NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS calc_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'calculated';

-- Function to calculate commission splits
CREATE OR REPLACE FUNCTION calculate_commission_splits(p_policy_id UUID)
RETURNS TABLE(
  insurer_commission NUMERIC,
  agent_commission NUMERIC,
  misp_commission NUMERIC, 
  employee_commission NUMERIC,
  broker_share NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  policy_rec RECORD;
  grid_rec RECORD;
  total_commission NUMERIC := 0;
  agent_rate NUMERIC := 0;
  misp_rate NUMERIC := 0;
  employee_rate NUMERIC := 0;
  remaining_commission NUMERIC := 0;
BEGIN
  -- Get policy details
  SELECT p.*, pt.category as product_category, pt.name as product_name
  INTO policy_rec
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  WHERE p.id = p_policy_id;

  -- Find matching commission grid
  SELECT cg.*
  INTO grid_rec
  FROM commission_grids cg
  WHERE cg.org_id = policy_rec.org_id
    AND cg.product_type = policy_rec.product_category
    AND (cg.product_subtype IS NULL OR cg.product_subtype = policy_rec.product_name)
    AND (cg.min_premium IS NULL OR COALESCE(policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0) >= cg.min_premium)
    AND (cg.max_premium IS NULL OR COALESCE(policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0) <= cg.max_premium)
    AND CURRENT_DATE BETWEEN cg.effective_from AND COALESCE(cg.effective_to, CURRENT_DATE)
  ORDER BY cg.created_at DESC
  LIMIT 1;

  IF grid_rec.id IS NOT NULL THEN
    -- Calculate total commission from insurer
    total_commission := COALESCE(policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0) * grid_rec.commission_rate / 100;
    
    -- Default split rates (can be made configurable later)
    agent_rate := 70; -- 70% to agent
    misp_rate := 75;  -- 75% to MISP
    employee_rate := 60; -- 60% to employee
    
    -- Calculate splits based on policy source
    IF policy_rec.source_type = 'agent' AND policy_rec.agent_id IS NOT NULL THEN
      agent_commission := total_commission * agent_rate / 100;
      broker_share := total_commission - agent_commission;
    ELSIF policy_rec.source_type = 'misp' AND policy_rec.misp_id IS NOT NULL THEN
      misp_commission := total_commission * misp_rate / 100;
      broker_share := total_commission - misp_commission;
    ELSIF policy_rec.source_type = 'employee' AND policy_rec.employee_id IS NOT NULL THEN
      employee_commission := total_commission * employee_rate / 100;
      broker_share := total_commission - employee_commission;
    ELSE
      -- Direct sale - all goes to broker
      broker_share := total_commission;
    END IF;
    
    insurer_commission := total_commission;
  END IF;

  RETURN QUERY SELECT 
    COALESCE(insurer_commission, 0)::NUMERIC,
    COALESCE(agent_commission, 0)::NUMERIC,
    COALESCE(misp_commission, 0)::NUMERIC,
    COALESCE(employee_commission, 0)::NUMERIC,
    COALESCE(broker_share, 0)::NUMERIC;
END;
$$;

-- Enhanced trigger to calculate and store commission splits
CREATE OR REPLACE FUNCTION auto_calculate_commission_splits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  commission_splits RECORD;
BEGIN
  -- Only calculate for active policies
  IF NEW.policy_status = 'active' AND COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) > 0 THEN
    
    -- Calculate splits
    SELECT * INTO commission_splits 
    FROM calculate_commission_splits(NEW.id);
    
    -- Update or insert commission record
    INSERT INTO policy_commissions (
      policy_id,
      org_id,
      product_type,
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
      created_by
    ) VALUES (
      NEW.id,
      NEW.org_id,
      (SELECT category FROM product_types WHERE id = NEW.product_type_id),
      0, -- Will be calculated by existing logic
      0,
      0,
      0,
      commission_splits.insurer_commission,
      commission_splits.insurer_commission,
      commission_splits.agent_commission,
      commission_splits.misp_commission,
      commission_splits.employee_commission,
      commission_splits.broker_share,
      'calculated',
      NEW.created_by
    )
    ON CONFLICT (policy_id) 
    DO UPDATE SET
      insurer_commission = commission_splits.insurer_commission,
      agent_commission = commission_splits.agent_commission,
      misp_commission = commission_splits.misp_commission,
      employee_commission = commission_splits.employee_commission,
      broker_share = commission_splits.broker_share,
      commission_status = 'calculated',
      calc_date = NOW(),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-calculation
DROP TRIGGER IF EXISTS trigger_auto_calculate_commission_splits ON policies;
CREATE TRIGGER trigger_auto_calculate_commission_splits
  AFTER INSERT OR UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_commission_splits();

-- SQL View for Reporting
CREATE OR REPLACE VIEW policy_commission_report AS
SELECT 
  p.id as policy_id,
  p.policy_number,
  pt.category as product_type,
  pt.name as product_name,
  p.start_date as policy_startdate,
  p.end_date as policy_enddate,
  p.customer_id,
  COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)) as customer_name,
  COALESCE(p.premium_with_gst, p.premium_without_gst, 0) as premium_amount,
  pc.insurer_commission,
  pc.agent_commission,
  pc.misp_commission,
  pc.employee_commission,
  pc.broker_share,
  pc.commission_status,
  pc.calc_date,
  p.org_id,
  p.created_at,
  -- Source details
  p.source_type,
  CASE 
    WHEN p.source_type = 'agent' THEN a.agent_name
    WHEN p.source_type = 'misp' THEN m.channel_partner_name
    WHEN p.source_type = 'employee' THEN e.name
    ELSE 'Direct'
  END as source_name
FROM policies p
JOIN product_types pt ON pt.id = p.product_type_id
JOIN customers c ON c.id = p.customer_id
LEFT JOIN policy_commissions pc ON pc.policy_id = p.id AND pc.is_active = true
LEFT JOIN agents a ON a.id = p.agent_id
LEFT JOIN misps m ON m.id = p.misp_id  
LEFT JOIN employees e ON e.id = p.employee_id
WHERE p.policy_status = 'active';