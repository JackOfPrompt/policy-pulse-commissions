-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS public.calculate_enhanced_comprehensive_commission_report(uuid, uuid);

-- Create updated function with commission tiers for agents
CREATE OR REPLACE FUNCTION public.calculate_enhanced_comprehensive_commission_report(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(policy_id uuid, policy_number text, product_category text, product_name text, plan_name text, provider text, source_type text, grid_table text, grid_id uuid, base_commission_rate numeric, reward_commission_rate numeric, bonus_commission_rate numeric, total_commission_rate numeric, insurer_commission numeric, agent_commission numeric, misp_commission numeric, employee_commission numeric, reporting_employee_commission numeric, broker_share numeric, calc_date timestamp with time zone, agent_id uuid, agent_name text, employee_id uuid, employee_name text, misp_id uuid, misp_name text, tier_name text, agent_tier_percentage numeric)
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
      COALESCE(lpg.commission_rate, 0) AS base_rate,
      COALESCE(lpg.reward_rate, 0) AS reward_rate,
      COALESCE(lpg.bonus_commission_rate, 0) AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id
    FROM base b
    JOIN life_payout_grid lpg 
      ON lpg.org_id = b.org_id
     AND lpg.provider = b.provider
     AND lower(lpg.product_type) = lower(b.product_category)
     AND (lpg.min_premium IS NULL OR b.premium_amount >= lpg.min_premium)
     AND (lpg.max_premium IS NULL OR b.premium_amount <= lpg.max_premium)
     AND lpg.is_active = true
     AND b.match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, b.match_date)
    WHERE lower(b.product_category) = 'life'

    UNION ALL

    -- Health payout grid matching
    SELECT 
      b.policy_id,
      hpg.id AS grid_id,
      'health_payout_grid' AS grid_table,
      COALESCE(hpg.commission_rate, 0) AS base_rate,
      COALESCE(hpg.reward_rate, 0) AS reward_rate,
      COALESCE(hpg.bonus_commission_rate, 0) AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id
    FROM base b
    JOIN health_payout_grid hpg
      ON hpg.org_id = b.org_id
     AND hpg.provider = b.provider
     AND lower(hpg.product_type) = lower(b.product_category)
     AND (hpg.min_premium IS NULL OR b.premium_amount >= hpg.min_premium)
     AND (hpg.max_premium IS NULL OR b.premium_amount <= hpg.max_premium)
     AND hpg.is_active = true
     AND b.match_date BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, b.match_date)
    WHERE lower(b.product_category) = 'health'

    UNION ALL

    -- Motor payout grid matching
    SELECT 
      b.policy_id,
      mpg.id AS grid_id,
      'motor_payout_grid' AS grid_table,
      COALESCE(mpg.commission_rate, 0) AS base_rate,
      COALESCE(mpg.reward_rate, 0) AS reward_rate,
      COALESCE(mpg.bonus_commission_rate, 0) AS bonus_rate,
      b.premium_amount,
      b.source_type,
      b.agent_id,
      b.misp_id,
      b.employee_id
    FROM base b
    JOIN motor_payout_grid mpg
      ON mpg.org_id = b.org_id
     AND mpg.provider = b.provider
     AND lower(mpg.product_type) = lower(b.product_category)
     AND (mpg.min_premium IS NULL OR b.premium_amount >= mpg.min_premium)
     AND (mpg.max_premium IS NULL OR b.premium_amount <= mpg.max_premium)
     AND mpg.is_active = true
     AND b.match_date BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, b.match_date)
    WHERE lower(b.product_category) = 'motor'
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
  ),
  agent_tier_info AS (
    SELECT 
      cc.*,
      a.agent_name,
      a.commission_tier_id,
      COALESCE(a.override_percentage, a.percentage) as agent_base_percentage,
      ct.name as tier_name,
      ct.base_percentage as tier_percentage
    FROM commission_calc cc
    LEFT JOIN agents a ON a.id = cc.agent_id
    LEFT JOIN commission_tiers ct ON ct.id = a.commission_tier_id 
      AND ct.org_id = cc.org_id 
      AND ct.is_active = true
      AND (ct.min_premium IS NULL OR cc.premium_amount >= ct.min_premium)
      AND (ct.max_premium IS NULL OR cc.premium_amount <= ct.max_premium)
  )
  SELECT 
    ati.policy_id,
    ati.policy_number,
    ati.product_category,
    ati.product_name,
    ati.plan_name,
    ati.provider,
    ati.source_type,
    ati.grid_table,
    ati.grid_id,
    ati.base_rate,
    ati.reward_rate,
    ati.bonus_rate,
    ati.total_rate,
    ati.total_insurer_commission,
    -- Agent commission calculation using commission tiers
    CASE 
      WHEN ati.source_type = 'agent' AND ati.agent_id IS NOT NULL THEN 
        ati.total_insurer_commission * COALESCE(
          ati.tier_percentage,  -- Use tier percentage if available
          ati.agent_base_percentage,  -- Fallback to agent percentage
          70  -- Default percentage
        ) / 100
      ELSE 0
    END AS agent_commission,
    -- MISP commission calculation (External)  
    CASE 
      WHEN ati.source_type = 'misp' AND ati.misp_id IS NOT NULL THEN 
        ati.total_insurer_commission * COALESCE(
          (SELECT percentage FROM misps WHERE id = ati.misp_id), 
          50
        ) / 100
      ELSE 0
    END AS misp_commission,
    -- Employee commission calculation (Internal)
    CASE 
      WHEN ati.source_type = 'employee' AND ati.employee_id IS NOT NULL THEN 
        ati.total_insurer_commission
      ELSE 0
    END AS employee_commission,
    -- Reporting employee commission (for external agents who report to employees)
    CASE 
      WHEN ati.source_type IN ('agent', 'misp') AND EXISTS (
        SELECT 1 FROM agents a 
        JOIN employees e ON e.id = a.employee_id 
        WHERE a.id = COALESCE(ati.agent_id, ati.misp_id)
      ) THEN 
        ati.total_insurer_commission - (
          ati.total_insurer_commission * COALESCE(
            ati.tier_percentage,
            ati.agent_base_percentage,
            COALESCE((SELECT percentage FROM misps WHERE id = ati.misp_id), 50)
          ) / 100
        )
      ELSE 0
    END AS reporting_employee_commission,
    -- Broker share calculation
    CASE 
      WHEN ati.source_type = 'employee' AND ati.employee_id IS NOT NULL THEN 0
      WHEN ati.source_type IN ('agent', 'misp') AND NOT EXISTS (
        SELECT 1 FROM agents a 
        JOIN employees e ON e.id = a.employee_id 
        WHERE a.id = COALESCE(ati.agent_id, ati.misp_id)
      ) THEN 0
      ELSE 
        ati.total_insurer_commission - COALESCE(
          CASE WHEN ati.source_type = 'employee' THEN ati.total_insurer_commission ELSE 0 END +
          CASE 
            WHEN ati.source_type IN ('agent', 'misp') AND NOT EXISTS (
              SELECT 1 FROM agents a JOIN employees e ON e.id = a.employee_id 
              WHERE a.id = COALESCE(ati.agent_id, ati.misp_id)
            ) THEN 0
            ELSE 0
          END, 0
        )
    END AS broker_share,
    NOW() AS calc_date,
    -- Additional fields for source display
    ati.agent_id,
    ati.agent_name,
    ati.employee_id,
    (SELECT name FROM employees WHERE id = ati.employee_id) as employee_name,
    ati.misp_id,
    (SELECT channel_partner_name FROM misps WHERE id = ati.misp_id) as misp_name,
    ati.tier_name,
    COALESCE(ati.tier_percentage, ati.agent_base_percentage) as agent_tier_percentage
  FROM agent_tier_info ati;
END;
$function$;