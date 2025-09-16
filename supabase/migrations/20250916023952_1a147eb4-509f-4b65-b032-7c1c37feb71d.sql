-- Drop and recreate functions with proper field naming standardization

-- 1. Drop existing function to avoid return type conflicts  
DROP FUNCTION IF EXISTS public.calculate_comprehensive_commission_report_normalized(uuid, uuid);

-- 2. Recreate the function with standardized field names and proper return type
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_commission_report_normalized(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(policy_id uuid, policy_number text, product_category text, product_name text, plan_name text, provider text, source_type text, grid_table text, grid_id uuid, commission_rate numeric, reward_rate numeric, total_commission_rate numeric, premium_amount numeric, insurer_commission numeric, agent_commission numeric, misp_commission numeric, employee_commission numeric, broker_share numeric, calc_date timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) AS premium_amount,
    COALESCE(p.issue_date, p.start_date, CURRENT_DATE) AS match_date
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  WHERE p.policy_status = 'active'
    AND (p_org_id IS NULL OR p.org_id = p_org_id)
    AND (p_policy_id IS NULL OR p.id = p_policy_id)
),
grid_match AS (
  -- Life matching using standardized field names
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
   AND lpg.product_type = b.product_name
   AND (
         (lpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND lpg.provider_id = b.provider_id)
      OR (lpg.provider_id IS NULL AND b.provider_id IS NULL AND lower(lpg.provider) = lower(COALESCE(b.provider, '')))
       )
   AND (
        (lpg.min_premium IS NULL AND lpg.max_premium IS NULL)
        OR (b.premium_amount BETWEEN COALESCE(lpg.min_premium, 0) AND COALESCE(lpg.max_premium, 999999999))
       )
   AND lpg.is_active = true
   AND b.match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, b.match_date)
  WHERE lower(b.product_name) = 'life'

  UNION ALL
  -- Health matching using standardized field names
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
   AND hpg.product_type = b.product_name
   AND (
         (hpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND hpg.provider_id = b.provider_id)
      OR (hpg.provider_id IS NULL AND b.provider_id IS NULL AND lower(hpg.provider) = lower(COALESCE(b.provider, '')))
       )
   AND (
        (hpg.min_premium IS NULL AND hpg.max_premium IS NULL)
        OR (b.premium_amount BETWEEN COALESCE(hpg.min_premium, 0) AND COALESCE(hpg.max_premium, 999999999))
       )
   AND hpg.is_active = true
   AND b.match_date BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, b.match_date)
  WHERE lower(b.product_name) = 'health'

  UNION ALL
  -- Motor matching using standardized field names
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
   AND mpg.product_type = b.product_name
   AND (
         (mpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND mpg.provider_id = b.provider_id)
      OR (mpg.provider_id IS NULL AND b.provider_id IS NULL AND lower(mpg.provider) = lower(COALESCE(b.provider, '')))
       )
   AND (
        (mpg.min_premium IS NULL AND mpg.max_premium IS NULL)
        OR (b.premium_amount BETWEEN COALESCE(mpg.min_premium, 0) AND COALESCE(mpg.max_premium, 999999999))
       )
   AND mpg.is_active = true
   AND b.match_date BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, b.match_date)
  WHERE lower(b.product_name) = 'motor'
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
  g.commission_rate + g.reward_rate AS total_commission_rate,
  b.premium_amount,
  (b.premium_amount * g.commission_rate/100) AS insurer_commission,
  CASE 
    WHEN b.source_type = 'agent' AND b.agent_id IS NOT NULL THEN 
      (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM agents WHERE id = b.agent_id), 70)/100
    ELSE 0
  END AS agent_commission,
  CASE 
    WHEN b.source_type = 'misp' AND b.misp_id IS NOT NULL THEN 
      (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM misps WHERE id = b.misp_id), 50)/100
    ELSE 0
  END AS misp_commission,
  CASE 
    WHEN b.source_type = 'employee' AND b.employee_id IS NOT NULL THEN 
      (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT employee_share_percentage FROM org_config WHERE org_id = b.org_id), 60)/100
    ELSE 0
  END AS employee_commission,
  -- Broker share = leftover after agent/misp/employee commission
  (b.premium_amount * g.commission_rate/100) - (
    CASE 
      WHEN b.source_type = 'agent' AND b.agent_id IS NOT NULL THEN 
        (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM agents WHERE id = b.agent_id), 70)/100
      WHEN b.source_type = 'misp' AND b.misp_id IS NOT NULL THEN 
        (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT percentage FROM misps WHERE id = b.misp_id), 50)/100
      WHEN b.source_type = 'employee' AND b.employee_id IS NOT NULL THEN 
        (b.premium_amount * g.commission_rate/100) * COALESCE((SELECT employee_share_percentage FROM org_config WHERE org_id = b.org_id), 60)/100
      ELSE 0
    END
  ) AS broker_share,
  now()::timestamp AS calc_date
FROM base b
JOIN grid_match g ON g.policy_id = b.policy_id;
$function$;