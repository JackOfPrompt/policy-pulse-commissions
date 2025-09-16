-- Update commission calculation logic for comprehensive business rules

-- 1. Add missing columns to payout grids if they don't exist
ALTER TABLE life_payout_grid 
ADD COLUMN IF NOT EXISTS base_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate NUMERIC DEFAULT 0;

-- Update existing commission_rate to be base_commission_rate if base is empty
UPDATE life_payout_grid 
SET base_commission_rate = COALESCE(commission_rate, 0) 
WHERE base_commission_rate = 0;

ALTER TABLE health_payout_grid 
ADD COLUMN IF NOT EXISTS base_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate NUMERIC DEFAULT 0;

UPDATE health_payout_grid 
SET base_commission_rate = COALESCE(commission_rate, 0) 
WHERE base_commission_rate = 0;

ALTER TABLE motor_payout_grid 
ADD COLUMN IF NOT EXISTS base_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate NUMERIC DEFAULT 0;

UPDATE motor_payout_grid 
SET base_commission_rate = COALESCE(commission_rate, 0) 
WHERE base_commission_rate = 0;

-- 2. Create employee_commission_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS employee_commission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  employee_id UUID,
  policy_id UUID NOT NULL,
  applied_grid_table TEXT,
  applied_grid_id UUID,
  base_commission_rate NUMERIC DEFAULT 0,
  reward_commission_rate NUMERIC DEFAULT 0,
  bonus_commission_rate NUMERIC DEFAULT 0,
  total_commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC NOT NULL,
  is_reporting_employee BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update agent_commission_history table to include new fields
ALTER TABLE agent_commission_history 
ADD COLUMN IF NOT EXISTS applied_grid_table TEXT,
ADD COLUMN IF NOT EXISTS applied_grid_id UUID,
ADD COLUMN IF NOT EXISTS base_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_reporting_employee_applied BOOLEAN DEFAULT false;

-- 4. Add employees reporting structure
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS reporting_employee_id UUID;

-- 5. Create comprehensive commission calculation function
CREATE OR REPLACE FUNCTION calculate_enhanced_comprehensive_commission_report(
  p_org_id UUID DEFAULT NULL,
  p_policy_id UUID DEFAULT NULL
)
RETURNS TABLE(
  policy_id UUID,
  policy_number TEXT,
  product_category TEXT,
  product_name TEXT,
  plan_name TEXT,
  provider TEXT,
  source_type TEXT,
  grid_table TEXT,
  grid_id UUID,
  base_commission_rate NUMERIC,
  reward_commission_rate NUMERIC,
  bonus_commission_rate NUMERIC,
  total_commission_rate NUMERIC,
  insurer_commission NUMERIC,
  agent_commission NUMERIC,
  misp_commission NUMERIC,
  employee_commission NUMERIC,
  reporting_employee_commission NUMERIC,
  broker_share NUMERIC,
  calc_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT 
      p.id AS policy_id,
      p.org_id,
      p.policy_number,
      pt.category AS product_category,
      pt.name AS product_name,
      p.plan_name,
      p.provider,
      p.provider_id,
      p.source_type,
      p.agent_id,
      p.misp_id,
      p.employee_id,
      COALESCE(p.premium_with_gst, p.premium_without_gst, p.gross_premium, 0) AS premium_amount,
      COALESCE(p.issue_date, p.start_date, CURRENT_DATE) AS match_date
    FROM policies p
    JOIN product_types pt ON pt.id = p.product_type_id
    WHERE p.policy_status = 'active'
      AND (p_org_id IS NULL OR p.org_id = p_org_id)
      AND (p_policy_id IS NULL OR p.id = p_policy_id)
  ),
  grid_match AS (
    -- Life payout grid matching
    SELECT 
      b.policy_id,
      lpg.id AS grid_id,
      'life_payout_grid' AS grid_table,
      COALESCE(lpg.base_commission_rate, lpg.commission_rate, 0) AS base_rate,
      COALESCE(lpg.reward_commission_rate, lpg.reward_rate, 0) AS reward_rate,
      COALESCE(lpg.bonus_commission_rate, 0) AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id
    FROM base b
    JOIN life_payout_grid lpg 
      ON lpg.org_id = b.org_id
     AND lpg.provider_id = b.provider_id
     AND lower(lpg.product_type) = lower(b.product_name)
     AND (lpg.min_premium IS NULL OR b.premium_amount >= lpg.min_premium)
     AND (lpg.max_premium IS NULL OR b.premium_amount <= lpg.max_premium)
     AND lpg.is_active = true
     AND b.match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, b.match_date)
    WHERE lower(b.product_name) = 'life'

    UNION ALL

    -- Health payout grid matching
    SELECT 
      b.policy_id,
      hpg.id AS grid_id,
      'health_payout_grid' AS grid_table,
      COALESCE(hpg.base_commission_rate, hpg.commission_rate, 0) AS base_rate,
      COALESCE(hpg.reward_commission_rate, hpg.reward_rate, 0) AS reward_rate,
      COALESCE(hpg.bonus_commission_rate, 0) AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id
    FROM base b
    JOIN health_payout_grid hpg
      ON hpg.org_id = b.org_id
     AND hpg.provider_id = b.provider_id
     AND lower(hpg.product_type) = lower(b.product_name)
     AND (hpg.min_premium IS NULL OR b.premium_amount >= hpg.min_premium)
     AND (hpg.max_premium IS NULL OR b.premium_amount <= hpg.max_premium)
     AND hpg.is_active = true
     AND b.match_date BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, b.match_date)
    WHERE lower(b.product_name) = 'health'

    UNION ALL

    -- Motor payout grid matching
    SELECT 
      b.policy_id,
      mpg.id AS grid_id,
      'motor_payout_grid' AS grid_table,
      COALESCE(mpg.base_commission_rate, mpg.commission_rate, 0) AS base_rate,
      COALESCE(mpg.reward_commission_rate, mpg.reward_rate, 0) AS reward_rate,
      COALESCE(mpg.bonus_commission_rate, 0) AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id
    FROM base b
    JOIN motor_payout_grid mpg
      ON mpg.org_id = b.org_id
     AND mpg.provider_id = b.provider_id
     AND lower(mpg.product_type) = lower(b.product_name)
     AND (mpg.min_premium IS NULL OR b.premium_amount >= mpg.min_premium)
     AND (mpg.max_premium IS NULL OR b.premium_amount <= mpg.max_premium)
     AND mpg.is_active = true
     AND b.match_date BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, b.match_date)
    WHERE lower(b.product_name) = 'motor'
  ),
  final_grid AS (
    SELECT DISTINCT ON (gm.policy_id)
      gm.*
    FROM grid_match gm
    ORDER BY gm.policy_id, gm.grid_id
  ),
  commission_calc AS (
    SELECT 
      b.*,
      g.grid_table,
      g.grid_id,
      g.base_rate,
      g.reward_rate,
      g.bonus_rate,
      (g.base_rate + g.reward_rate + g.bonus_rate) AS total_rate,
      (b.premium_amount * (g.base_rate + g.reward_rate + g.bonus_rate) / 100) AS total_insurer_commission
    FROM base b
    JOIN final_grid g ON g.policy_id = b.policy_id
  )
  SELECT 
    cc.policy_id,
    cc.policy_number,
    cc.product_category,
    cc.product_name,
    cc.plan_name,
    cc.provider,
    cc.source_type,
    cc.grid_table,
    cc.grid_id,
    cc.base_rate,
    cc.reward_rate,
    cc.bonus_rate,
    cc.total_rate,
    cc.total_insurer_commission,
    -- Agent commission calculation (External)
    CASE 
      WHEN cc.source_type = 'agent' AND cc.agent_id IS NOT NULL THEN 
        cc.total_insurer_commission * COALESCE(
          (SELECT COALESCE(override_percentage, percentage) FROM agents WHERE id = cc.agent_id), 
          70
        ) / 100
      ELSE 0
    END AS agent_commission,
    -- MISP commission calculation (External)  
    CASE 
      WHEN cc.source_type = 'misp' AND cc.misp_id IS NOT NULL THEN 
        cc.total_insurer_commission * COALESCE(
          (SELECT percentage FROM misps WHERE id = cc.misp_id), 
          50
        ) / 100
      ELSE 0
    END AS misp_commission,
    -- Employee commission calculation (Internal)
    CASE 
      WHEN cc.source_type = 'employee' AND cc.employee_id IS NOT NULL THEN 
        cc.total_insurer_commission
      ELSE 0
    END AS employee_commission,
    -- Reporting employee commission (for external agents who report to employees)
    CASE 
      WHEN cc.source_type IN ('agent', 'misp') AND EXISTS (
        SELECT 1 FROM agents a 
        JOIN employees e ON e.id = a.employee_id 
        WHERE a.id = COALESCE(cc.agent_id, cc.misp_id)
      ) THEN 
        cc.total_insurer_commission - (
          cc.total_insurer_commission * COALESCE(
            (SELECT COALESCE(override_percentage, percentage) FROM agents WHERE id = COALESCE(cc.agent_id, cc.misp_id)), 
            COALESCE((SELECT percentage FROM misps WHERE id = cc.misp_id), 50)
          ) / 100
        )
      ELSE 0
    END AS reporting_employee_commission,
    -- Broker share calculation
    CASE 
      WHEN cc.source_type = 'employee' AND cc.employee_id IS NOT NULL THEN 0
      WHEN cc.source_type IN ('agent', 'misp') AND NOT EXISTS (
        SELECT 1 FROM agents a 
        JOIN employees e ON e.id = a.employee_id 
        WHERE a.id = COALESCE(cc.agent_id, cc.misp_id)
      ) THEN 0
      ELSE 
        cc.total_insurer_commission - COALESCE(
          -- Subtract employee commission if internal
          CASE WHEN cc.source_type = 'employee' THEN cc.total_insurer_commission ELSE 0 END +
          -- Subtract agent/misp commission if external with no reporting
          CASE 
            WHEN cc.source_type IN ('agent', 'misp') AND NOT EXISTS (
              SELECT 1 FROM agents a JOIN employees e ON e.id = a.employee_id 
              WHERE a.id = COALESCE(cc.agent_id, cc.misp_id)
            ) THEN 0
            ELSE 0
          END, 0
        )
    END AS broker_share,
    NOW() AS calc_date
  FROM commission_calc cc;
END;
$$;

-- 6. Update the existing comprehensive commission function to use the enhanced version
CREATE OR REPLACE FUNCTION calculate_comprehensive_commission_report_normalized(
  p_org_id UUID DEFAULT NULL,
  p_policy_id UUID DEFAULT NULL
)
RETURNS TABLE(
  policy_id UUID,
  policy_number TEXT,
  product_category TEXT,
  product_name TEXT,
  plan_name TEXT,
  provider TEXT,
  source_type TEXT,
  grid_table TEXT,
  grid_id UUID,
  commission_rate NUMERIC,
  reward_rate NUMERIC,
  insurer_commission NUMERIC,
  agent_commission NUMERIC,
  misp_commission NUMERIC,
  employee_commission NUMERIC,
  broker_share NUMERIC,
  calc_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    policy_id,
    policy_number,
    product_category,
    product_name,
    plan_name,
    provider,
    source_type,
    grid_table,
    grid_id,
    total_commission_rate as commission_rate,
    reward_commission_rate as reward_rate,
    insurer_commission,
    agent_commission,
    misp_commission,
    employee_commission,
    broker_share,
    calc_date
  FROM calculate_enhanced_comprehensive_commission_report(p_org_id, p_policy_id);
$$;

-- 7. Create function to sync enhanced commissions
CREATE OR REPLACE FUNCTION sync_enhanced_comprehensive_commissions(p_org_id UUID DEFAULT NULL)
RETURNS VOID
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

  -- Insert/update commission records using enhanced calculation
  FOR commission_rec IN 
    SELECT * FROM calculate_enhanced_comprehensive_commission_report(p_org_id)
  LOOP
    -- Update policy_commissions table
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
      commission_rec.total_commission_rate,
      commission_rec.reward_commission_rate,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission * commission_rec.reward_commission_rate / 100,
      commission_rec.insurer_commission,
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

    -- Insert agent commission history if applicable
    IF commission_rec.agent_commission > 0 THEN
      INSERT INTO agent_commission_history (
        org_id,
        agent_id,
        policy_id,
        applied_grid_table,
        applied_grid_id,
        base_commission_rate,
        reward_commission_rate,
        bonus_commission_rate,
        total_commission_rate,
        commission_percentage,
        commission_amount,
        is_reporting_employee_applied
      )
      VALUES (
        p_org_id,
        (SELECT agent_id FROM policies WHERE id = commission_rec.policy_id),
        commission_rec.policy_id,
        commission_rec.grid_table,
        commission_rec.grid_id,
        commission_rec.base_commission_rate,
        commission_rec.reward_commission_rate,
        commission_rec.bonus_commission_rate,
        commission_rec.total_commission_rate,
        (SELECT COALESCE(override_percentage, percentage) FROM agents WHERE id = (SELECT agent_id FROM policies WHERE id = commission_rec.policy_id)),
        commission_rec.agent_commission,
        commission_rec.reporting_employee_commission > 0
      )
      ON CONFLICT (policy_id) DO UPDATE SET
        commission_amount = EXCLUDED.commission_amount,
        commission_percentage = EXCLUDED.commission_percentage,
        is_reporting_employee_applied = EXCLUDED.is_reporting_employee_applied;
    END IF;

    -- Insert employee commission history if applicable
    IF commission_rec.employee_commission > 0 OR commission_rec.reporting_employee_commission > 0 THEN
      INSERT INTO employee_commission_history (
        org_id,
        employee_id,
        policy_id,
        applied_grid_table,
        applied_grid_id,
        base_commission_rate,
        reward_commission_rate,
        bonus_commission_rate,
        total_commission_rate,
        commission_amount,
        is_reporting_employee
      )
      VALUES (
        p_org_id,
        COALESCE(
          (SELECT employee_id FROM policies WHERE id = commission_rec.policy_id),
          (SELECT a.employee_id FROM agents a JOIN policies p ON p.agent_id = a.id WHERE p.id = commission_rec.policy_id)
        ),
        commission_rec.policy_id,
        commission_rec.grid_table,
        commission_rec.grid_id,
        commission_rec.base_commission_rate,
        commission_rec.reward_commission_rate,
        commission_rec.bonus_commission_rate,
        commission_rec.total_commission_rate,
        GREATEST(commission_rec.employee_commission, commission_rec.reporting_employee_commission),
        commission_rec.reporting_employee_commission > 0
      );
    END IF;
  END LOOP;
END;
$$;

-- 8. Create updated trigger for automatic commission calculation
CREATE OR REPLACE FUNCTION auto_calculate_enhanced_commission_splits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only calculate for active policies with premium
  IF NEW.policy_status = 'active' AND COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, NEW.gross_premium, 0) > 0 THEN
    -- Call the enhanced commission sync for this specific policy
    PERFORM sync_enhanced_comprehensive_commissions(NEW.org_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 9. Update triggers on policies table
DROP TRIGGER IF EXISTS auto_calculate_commission_splits_trigger ON policies;
CREATE TRIGGER auto_calculate_enhanced_commission_splits_trigger
  AFTER INSERT OR UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_enhanced_commission_splits();

-- 10. Add RLS policies for new tables
ALTER TABLE employee_commission_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org employee commission history" 
ON employee_commission_history 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert their org employee commission history" 
ON employee_commission_history 
FOR INSERT 
WITH CHECK (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));