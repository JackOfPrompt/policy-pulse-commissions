-- Update the enhanced comprehensive commission report function to use agent base_percentage
CREATE OR REPLACE FUNCTION public.calculate_enhanced_comprehensive_commission_report(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(policy_id uuid, policy_number text, product_category text, product_name text, plan_name text, provider text, source_type text, grid_table text, grid_id uuid, base_commission_rate numeric, reward_commission_rate numeric, bonus_commission_rate numeric, total_commission_rate numeric, insurer_commission numeric, agent_commission numeric, misp_commission numeric, employee_commission numeric, reporting_employee_commission numeric, broker_share numeric, calc_date timestamp with time zone, agent_id uuid, agent_name text, agent_code text, employee_id uuid, employee_name text, employee_code text, misp_id uuid, misp_name text, tier_name text, agent_tier_percentage numeric, customer_name text, premium_amount numeric)
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
      -- Premium mapping based on product type
      CASE 
        WHEN lower(pt.category) = 'life' THEN COALESCE(p.premium_without_gst, 0)
        WHEN lower(pt.category) = 'motor' THEN COALESCE(p.premium_with_gst, p.gross_premium, 0) 
        WHEN lower(pt.category) = 'health' THEN COALESCE(p.premium_with_gst, p.gross_premium, 0)
        ELSE COALESCE(p.premium_with_gst, p.premium_without_gst, p.gross_premium, 0)
      END AS premium_amount,
      COALESCE(p.issue_date, p.start_date, CURRENT_DATE) AS match_date,
      CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name
    FROM policies p
    JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
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
  commission_calc AS (
    SELECT 
      b.policy_id,
      b.policy_number,
      b.product_category,
      b.product_name,
      b.plan_name,
      b.provider,
      b.source_type,
      COALESCE(gm.grid_table, 'no_grid') AS grid_table,
      gm.grid_id,
      COALESCE(gm.base_rate, 0) AS base_commission_rate,
      COALESCE(gm.reward_rate, 0) AS reward_commission_rate,
      COALESCE(gm.bonus_rate, 0) AS bonus_commission_rate,
      COALESCE(gm.base_rate, 0) + COALESCE(gm.reward_rate, 0) + COALESCE(gm.bonus_rate, 0) AS total_commission_rate,
      -- Calculate insurer commission (total from grid)
      b.premium_amount * (COALESCE(gm.base_rate, 0) + COALESCE(gm.reward_rate, 0) + COALESCE(gm.bonus_rate, 0)) / 100 AS insurer_commission,
      b.premium_amount,
      b.agent_id,
      b.misp_id,
      b.employee_id,
      b.customer_name,
      NOW() as calc_date
    FROM base b
    LEFT JOIN grid_match gm ON gm.policy_id = b.policy_id
  ),
  enhanced_calc AS (
    SELECT 
      cc.*,
      -- Agent details and commission calculation using base_percentage
      a.agent_name,
      COALESCE(a.agent_code, a.id::text) as agent_code,
      COALESCE(a.base_percentage, COALESCE(a.override_percentage, 50)) as agent_base_percentage,
      ct.name as tier_name,
      ct.base_percentage as agent_tier_percentage,
      -- Employee details  
      e.name as employee_name,
      COALESCE(e.employee_code, e.id::text) as employee_code,
      -- MISP details
      m.channel_partner_name as misp_name,
      -- Reporting employee for external sources
      re.id as reporting_employee_id,
      re.name as reporting_employee_name,
      -- Org configuration
      oc.employee_share_percentage,
      oc.broker_share_percentage
    FROM commission_calc cc
    LEFT JOIN agents a ON a.id = cc.agent_id
    LEFT JOIN commission_tiers ct ON ct.id = a.commission_tier_id
    LEFT JOIN employees e ON e.id = cc.employee_id  
    LEFT JOIN misps m ON m.id = cc.misp_id
    -- Get reporting employee for external sources
    LEFT JOIN employees re ON re.id = COALESCE(a.employee_id, m.employee_id)
    LEFT JOIN org_config oc ON oc.org_id = (
      SELECT org_id FROM policies WHERE id = cc.policy_id
    )
  )
  SELECT 
    ec.policy_id,
    ec.policy_number,
    ec.product_category,
    ec.product_name,
    ec.plan_name,
    ec.provider,
    ec.source_type,
    ec.grid_table,
    ec.grid_id,
    ec.base_commission_rate,
    ec.reward_commission_rate,
    ec.bonus_commission_rate,
    ec.total_commission_rate,
    ec.insurer_commission,
    -- Calculate agent commission using base_percentage when external
    CASE 
      WHEN ec.source_type IN ('agent', 'external') AND ec.agent_id IS NOT NULL 
      THEN ec.insurer_commission * COALESCE(ec.agent_base_percentage, 50) / 100
      ELSE 0 
    END AS agent_commission,
    -- Calculate MISP commission
    CASE 
      WHEN ec.source_type = 'misp' AND ec.misp_id IS NOT NULL 
      THEN ec.insurer_commission * 50 / 100  -- Default 50% for MISP
      ELSE 0 
    END AS misp_commission,
    -- Calculate employee commission
    CASE 
      WHEN ec.source_type IN ('employee', 'internal') AND ec.employee_id IS NOT NULL 
      THEN ec.insurer_commission * COALESCE(ec.employee_share_percentage, 60) / 100
      ELSE 0 
    END AS employee_commission,
    -- Calculate reporting employee commission (override for external sources)
    CASE 
      WHEN ec.source_type IN ('agent', 'misp') AND ec.reporting_employee_id IS NOT NULL 
      THEN ec.insurer_commission * 10 / 100  -- 10% override for reporting employee
      ELSE 0 
    END AS reporting_employee_commission,
    -- Calculate broker share (remaining after all commissions)
    ec.insurer_commission - (
      CASE 
        WHEN ec.source_type IN ('agent', 'external') AND ec.agent_id IS NOT NULL 
        THEN ec.insurer_commission * COALESCE(ec.agent_base_percentage, 50) / 100
        ELSE 0 
      END +
      CASE 
        WHEN ec.source_type = 'misp' AND ec.misp_id IS NOT NULL 
        THEN ec.insurer_commission * 50 / 100
        ELSE 0 
      END +
      CASE 
        WHEN ec.source_type IN ('employee', 'internal') AND ec.employee_id IS NOT NULL 
        THEN ec.insurer_commission * COALESCE(ec.employee_share_percentage, 60) / 100
        ELSE 0 
      END +
      CASE 
        WHEN ec.source_type IN ('agent', 'misp') AND ec.reporting_employee_id IS NOT NULL 
        THEN ec.insurer_commission * 10 / 100
        ELSE 0 
      END
    ) AS broker_share,
    ec.calc_date,
    ec.agent_id,
    ec.agent_name,
    ec.agent_code,
    ec.employee_id,
    ec.employee_name,
    ec.employee_code,
    ec.misp_id,
    ec.misp_name,
    ec.tier_name,
    ec.agent_tier_percentage,
    ec.customer_name,
    ec.premium_amount
  FROM enhanced_calc ec
  ORDER BY ec.policy_id;
END;
$function$;