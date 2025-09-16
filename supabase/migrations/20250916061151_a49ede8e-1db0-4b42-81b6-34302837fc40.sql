-- First, let's update the commission grids table to ensure all required fields exist
-- Add missing date filter fields if they don't exist
ALTER TABLE commission_grids 
ADD COLUMN IF NOT EXISTS reward_effective_from date,
ADD COLUMN IF NOT EXISTS reward_effective_to date,
ADD COLUMN IF NOT EXISTS bonus_effective_from date, 
ADD COLUMN IF NOT EXISTS bonus_effective_to date;

-- Update life_payout_grid to ensure all required fields exist
ALTER TABLE life_payout_grid
ADD COLUMN IF NOT EXISTS reward_effective_from date,
ADD COLUMN IF NOT EXISTS reward_effective_to date,
ADD COLUMN IF NOT EXISTS bonus_effective_from date,
ADD COLUMN IF NOT EXISTS bonus_effective_to date;

-- Update health_payout_grid to ensure all required fields exist  
ALTER TABLE health_payout_grid
ADD COLUMN IF NOT EXISTS reward_effective_from date,
ADD COLUMN IF NOT EXISTS reward_effective_to date,
ADD COLUMN IF NOT EXISTS bonus_effective_from date,
ADD COLUMN IF NOT EXISTS bonus_effective_to date;

-- Update motor_payout_grid to ensure all required fields exist
ALTER TABLE motor_payout_grid
ADD COLUMN IF NOT EXISTS reward_effective_from date,
ADD COLUMN IF NOT EXISTS reward_effective_to date,
ADD COLUMN IF NOT EXISTS bonus_effective_from date,
ADD COLUMN IF NOT EXISTS bonus_effective_to date;

-- Add reporting_employee_id to policies table if it doesn't exist
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS reporting_employee_id uuid;

-- Now let's rewrite the comprehensive commission calculation function
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_commission_report(
  p_org_id uuid DEFAULT NULL::uuid,
  p_policy_id uuid DEFAULT NULL::uuid
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
  base_rate numeric,
  reward_rate numeric,
  bonus_rate numeric,
  total_rate numeric,
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  reporting_employee_commission numeric,
  broker_share numeric,
  applied_tier_id uuid,
  used_override boolean,
  calc_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      p.reporting_employee_id,
      COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) AS premium_amount,
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
      CASE 
        WHEN lpg.reward_commission_rate IS NOT NULL 
        AND (lpg.reward_effective_from IS NULL OR b.match_date >= lpg.reward_effective_from)
        AND (lpg.reward_effective_to IS NULL OR b.match_date <= lpg.reward_effective_to)
        THEN COALESCE(lpg.reward_commission_rate, lpg.reward_rate, 0)
        ELSE 0
      END AS reward_rate,
      CASE 
        WHEN lpg.bonus_commission_rate IS NOT NULL 
        AND (lpg.bonus_effective_from IS NULL OR b.match_date >= lpg.bonus_effective_from)
        AND (lpg.bonus_effective_to IS NULL OR b.match_date <= lpg.bonus_effective_to)
        THEN COALESCE(lpg.bonus_commission_rate, 0)
        ELSE 0
      END AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id,
      b.reporting_employee_id
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
      CASE 
        WHEN hpg.reward_commission_rate IS NOT NULL 
        AND (hpg.reward_effective_from IS NULL OR b.match_date >= hpg.reward_effective_from)
        AND (hpg.reward_effective_to IS NULL OR b.match_date <= hpg.reward_effective_to)
        THEN COALESCE(hpg.reward_commission_rate, hpg.reward_rate, 0)
        ELSE 0
      END AS reward_rate,
      CASE 
        WHEN hpg.bonus_commission_rate IS NOT NULL 
        AND (hpg.bonus_effective_from IS NULL OR b.match_date >= hpg.bonus_effective_from)
        AND (hpg.bonus_effective_to IS NULL OR b.match_date <= hpg.bonus_effective_to)
        THEN COALESCE(hpg.bonus_commission_rate, 0)
        ELSE 0
      END AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id,
      b.reporting_employee_id
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
      CASE 
        WHEN mpg.reward_commission_rate IS NOT NULL 
        AND (mpg.reward_effective_from IS NULL OR b.match_date >= mpg.reward_effective_from)
        AND (mpg.reward_effective_to IS NULL OR b.match_date <= mpg.reward_effective_to)
        THEN COALESCE(mpg.reward_commission_rate, mpg.reward_rate, 0)
        ELSE 0
      END AS reward_rate,
      CASE 
        WHEN mpg.bonus_commission_rate IS NOT NULL 
        AND (mpg.bonus_effective_from IS NULL OR b.match_date >= mpg.bonus_effective_from)
        AND (mpg.bonus_effective_to IS NULL OR b.match_date <= mpg.bonus_effective_to)
        THEN COALESCE(mpg.bonus_commission_rate, 0)
        ELSE 0
      END AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id,
      b.reporting_employee_id
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
      fg.*,
      (fg.base_rate + fg.reward_rate + fg.bonus_rate) AS total_rate,
      (fg.premium_amount * (fg.base_rate + fg.reward_rate + fg.bonus_rate) / 100) AS total_insurer_commission,
      
      -- Get agent details for commission calculation
      a.commission_tier_id as agent_tier_id,
      a.override_percentage as agent_override_percentage,
      COALESCE(act.base_percentage, 70) as agent_tier_percentage,
      a.employee_id as agent_reporting_employee_id,
      
      -- Get MISP details for commission calculation  
      m.commission_tier_id as misp_tier_id,
      m.override_percentage as misp_override_percentage,
      COALESCE(mct.base_percentage, 50) as misp_tier_percentage
      
    FROM final_grid fg
    LEFT JOIN agents a ON a.id = fg.agent_id
    LEFT JOIN commission_tiers act ON act.id = a.commission_tier_id
    LEFT JOIN misps m ON m.id = fg.misp_id
    LEFT JOIN commission_tiers mct ON mct.id = m.commission_tier_id
  )
  SELECT 
    cc.policy_id,
    b.policy_number,
    b.product_category,
    b.product_name,
    b.plan_name,
    b.provider,
    cc.source_type,
    cc.grid_table,
    cc.grid_id,
    cc.base_rate,
    cc.reward_rate,
    cc.bonus_rate,
    cc.total_rate,
    cc.total_insurer_commission as insurer_commission,
    
    -- Agent commission calculation (External)
    CASE 
      WHEN cc.source_type = 'agent' AND cc.agent_id IS NOT NULL THEN 
        cc.total_insurer_commission * COALESCE(cc.agent_override_percentage, cc.agent_tier_percentage) / 100
      ELSE 0
    END AS agent_commission,
    
    -- MISP commission calculation (External)  
    CASE 
      WHEN cc.source_type = 'misp' AND cc.misp_id IS NOT NULL THEN 
        cc.total_insurer_commission * COALESCE(cc.misp_override_percentage, cc.misp_tier_percentage) / 100
      ELSE 0
    END AS misp_commission,
    
    -- Employee commission calculation (Internal - base rate only)
    CASE 
      WHEN cc.source_type = 'employee' AND cc.employee_id IS NOT NULL THEN 
        cc.premium_amount * cc.base_rate / 100
      ELSE 0
    END AS employee_commission,
    
    -- Reporting employee commission (for external agents who report to employees)
    CASE 
      WHEN cc.source_type = 'agent' AND cc.agent_reporting_employee_id IS NOT NULL THEN 
        cc.total_insurer_commission - (cc.total_insurer_commission * COALESCE(cc.agent_override_percentage, cc.agent_tier_percentage) / 100)
      WHEN cc.source_type = 'misp' AND cc.reporting_employee_id IS NOT NULL THEN 
        cc.total_insurer_commission - (cc.total_insurer_commission * COALESCE(cc.misp_override_percentage, cc.misp_tier_percentage) / 100)
      ELSE 0
    END AS reporting_employee_commission,
    
    -- Broker share calculation
    CASE 
      -- Internal policy: broker gets reward + bonus portion
      WHEN cc.source_type = 'employee' AND cc.employee_id IS NOT NULL THEN 
        cc.total_insurer_commission - (cc.premium_amount * cc.base_rate / 100)
      -- External policy with reporting employee: no broker share
      WHEN cc.source_type = 'agent' AND cc.agent_reporting_employee_id IS NOT NULL THEN 0
      WHEN cc.source_type = 'misp' AND cc.reporting_employee_id IS NOT NULL THEN 0
      -- External policy without reporting employee: remainder goes to broker
      WHEN cc.source_type = 'agent' AND cc.agent_reporting_employee_id IS NULL THEN 
        cc.total_insurer_commission - (cc.total_insurer_commission * COALESCE(cc.agent_override_percentage, cc.agent_tier_percentage) / 100)
      WHEN cc.source_type = 'misp' AND cc.agent_reporting_employee_id IS NULL THEN 
        cc.total_insurer_commission - (cc.total_insurer_commission * COALESCE(cc.misp_override_percentage, cc.misp_tier_percentage) / 100)
      ELSE cc.total_insurer_commission
    END AS broker_share,
    
    COALESCE(cc.agent_tier_id, cc.misp_tier_id) AS applied_tier_id,
    (cc.agent_override_percentage IS NOT NULL OR cc.misp_override_percentage IS NOT NULL) AS used_override,
    NOW() AS calc_date
    
  FROM commission_calc cc
  JOIN base b ON b.policy_id = cc.policy_id;
END;
$function$;