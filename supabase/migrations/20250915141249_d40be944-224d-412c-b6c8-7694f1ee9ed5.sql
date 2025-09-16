-- Update the comprehensive commission calculation to include reward rates and fix distribution logic
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_commission_report_normalized(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
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
   total_commission_rate numeric,
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
  -- Life matching using product name and provider_id with provider name fallback
  SELECT 
    b.policy_id,
    lpg.id AS grid_id,
    'life_payout_grid' AS grid_table,
    lpg.commission_rate,
    COALESCE(lpg.reward_rate, 0) AS reward_rate,
    (lpg.commission_rate + COALESCE(lpg.reward_rate, 0)) AS total_commission_rate,
    b.premium_amount,
    b.source_type,
    b.agent_id,
    b.misp_id,
    b.employee_id,
    b.org_id
  FROM base b
  JOIN life_payout_grid lpg 
    ON lpg.org_id = b.org_id
   AND lower(lpg.product_type) = lower(b.product_name)
   AND (
         (lpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND lpg.provider_id = b.provider_id)
      OR (lpg.provider_id IS NULL AND lower(lpg.provider) = lower(COALESCE(b.provider, '')))
       )
   AND (
        (lpg.premium_start_price IS NULL AND lpg.premium_end_price IS NULL)
        OR (b.premium_amount BETWEEN COALESCE(lpg.premium_start_price, 0) AND COALESCE(lpg.premium_end_price, 999999999))
       )
   AND lpg.is_active = true
   AND b.match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, b.match_date)
  WHERE lower(b.product_name) = 'life'

  UNION ALL
  -- Health matching
  SELECT 
    b.policy_id,
    hpg.id AS grid_id,
    'health_payout_grid' AS grid_table,
    hpg.commission_rate,
    COALESCE(hpg.reward_rate, 0) AS reward_rate,
    (hpg.commission_rate + COALESCE(hpg.reward_rate, 0)) AS total_commission_rate,
    b.premium_amount,
    b.source_type,
    b.agent_id,
    b.misp_id,
    b.employee_id,
    b.org_id
  FROM base b
  JOIN health_payout_grid hpg
    ON hpg.org_id = b.org_id
   AND lower(hpg.product_type) = lower(b.product_name)
   AND (
         (hpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND hpg.provider_id = b.provider_id)
      OR (hpg.provider_id IS NULL AND lower(hpg.provider) = lower(COALESCE(b.provider, '')))
       )
   AND hpg.is_active = true
   AND b.match_date BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, b.match_date)
  WHERE lower(b.product_name) = 'health'

  UNION ALL
  -- Motor matching
  SELECT 
    b.policy_id,
    mpg.id AS grid_id,
    'motor_payout_grid' AS grid_table,
    mpg.commission_rate,
    COALESCE(mpg.reward_rate, 0) AS reward_rate,
    (mpg.commission_rate + COALESCE(mpg.reward_rate, 0)) AS total_commission_rate,
    b.premium_amount,
    b.source_type,
    b.agent_id,
    b.misp_id,
    b.employee_id,
    b.org_id
  FROM base b
  JOIN motor_payout_grid mpg
    ON mpg.org_id = b.org_id
   AND lower(mpg.product_type) = lower(b.product_name)
   AND (
         (mpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND mpg.provider_id = b.provider_id)
      OR (mpg.provider_id IS NULL AND lower(mpg.provider) = lower(COALESCE(b.provider, '')))
       )
   AND mpg.is_active = true
   AND b.match_date BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, b.match_date)
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
  g.total_commission_rate,
  -- Calculate insurer commission using total commission rate (commission + reward)
  (b.premium_amount * g.total_commission_rate/100) AS insurer_commission,
  -- Agent commission calculation with proper percentage from agents table
  CASE 
    WHEN b.source_type = 'agent' AND b.agent_id IS NOT NULL THEN 
      (b.premium_amount * g.total_commission_rate/100) * COALESCE((SELECT percentage FROM agents WHERE id = b.agent_id), 70)/100
    ELSE 0
  END AS agent_commission,
  -- MISP commission calculation with proper percentage from misps table
  CASE 
    WHEN b.source_type = 'misp' AND b.misp_id IS NOT NULL THEN 
      (b.premium_amount * g.total_commission_rate/100) * COALESCE((SELECT percentage FROM misps WHERE id = b.misp_id), 50)/100
    ELSE 0
  END AS misp_commission,
  -- Employee commission calculation with org config percentage
  CASE 
    WHEN b.source_type = 'employee' AND b.employee_id IS NOT NULL THEN 
      (b.premium_amount * g.total_commission_rate/100) * COALESCE((SELECT employee_share_percentage FROM org_config WHERE org_id = b.org_id), 60)/100
    ELSE 0
  END AS employee_commission,
  -- Broker share = remaining after agent/misp/employee commission
  (b.premium_amount * g.total_commission_rate/100) - (
    CASE 
      WHEN b.source_type = 'agent' AND b.agent_id IS NOT NULL THEN 
        (b.premium_amount * g.total_commission_rate/100) * COALESCE((SELECT percentage FROM agents WHERE id = b.agent_id), 70)/100
      WHEN b.source_type = 'misp' AND b.misp_id IS NOT NULL THEN 
        (b.premium_amount * g.total_commission_rate/100) * COALESCE((SELECT percentage FROM misps WHERE id = b.misp_id), 50)/100
      WHEN b.source_type = 'employee' AND b.employee_id IS NOT NULL THEN 
        (b.premium_amount * g.total_commission_rate/100) * COALESCE((SELECT employee_share_percentage FROM org_config WHERE org_id = b.org_id), 60)/100
      ELSE 0
    END
  ) AS broker_share,
  now()::timestamp AS calc_date
FROM base b
JOIN grid_match g ON g.policy_id = b.policy_id;
$function$;

-- Update the enhanced commission distribution function to use the new calculation
CREATE OR REPLACE FUNCTION public.calculate_enhanced_commission_distribution_updated(p_policy_id uuid)
 RETURNS TABLE(
   policy_id uuid, 
   policy_number text, 
   product_type text, 
   customer_name text, 
   premium_amount numeric, 
   provider text, 
   source_type text, 
   source_name text, 
   commission_rate numeric,
   reward_rate numeric,
   total_commission_rate numeric,
   insurer_commission_amount numeric, 
   agent_commission_rate numeric, 
   agent_commission_amount numeric, 
   misp_commission_rate numeric, 
   misp_commission_amount numeric, 
   employee_commission_rate numeric, 
   employee_commission_amount numeric, 
   broker_share_rate numeric, 
   broker_share_amount numeric, 
   commission_status text, 
   grid_source text, 
   calc_date timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result record;
BEGIN
  -- Use the comprehensive calculation function
  SELECT * INTO result 
  FROM calculate_comprehensive_commission_report_normalized(NULL, p_policy_id)
  LIMIT 1;

  IF result.policy_id IS NULL THEN
    RETURN QUERY 
    SELECT 
      p_policy_id, 
      ''::text, ''::text, ''::text, 0::numeric, ''::text, ''::text, ''::text,
      0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 
      0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 
      'policy_not_found'::text, ''::text, NOW();
    RETURN;
  END IF;

  -- Get policy and customer details
  RETURN QUERY
  SELECT 
    result.policy_id,
    result.policy_number,
    result.product_name,
    CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
    result.insurer_commission / (result.total_commission_rate/100) as premium_amount, -- Calculate back from commission
    result.provider,
    COALESCE(result.source_type, 'direct'),
    CASE 
      WHEN result.source_type = 'agent' THEN COALESCE((SELECT agent_name FROM agents WHERE id = p.agent_id), 'Unknown Agent')
      WHEN result.source_type = 'misp' THEN COALESCE((SELECT channel_partner_name FROM misps WHERE id = p.misp_id), 'Unknown MISP')  
      WHEN result.source_type = 'employee' THEN COALESCE((SELECT name FROM employees WHERE id = p.employee_id), 'Unknown Employee')
      ELSE 'Direct'
    END as source_name,
    result.commission_rate,
    result.reward_rate,
    result.total_commission_rate,
    result.insurer_commission,
    CASE WHEN result.insurer_commission > 0 THEN (result.agent_commission * 100 / result.insurer_commission) ELSE 0 END as agent_commission_rate,
    result.agent_commission,
    CASE WHEN result.insurer_commission > 0 THEN (result.misp_commission * 100 / result.insurer_commission) ELSE 0 END as misp_commission_rate,
    result.misp_commission,
    CASE WHEN result.insurer_commission > 0 THEN (result.employee_commission * 100 / result.insurer_commission) ELSE 0 END as employee_commission_rate,
    result.employee_commission,
    CASE WHEN result.insurer_commission > 0 THEN (result.broker_share * 100 / result.insurer_commission) ELSE 0 END as broker_share_rate,
    result.broker_share,
    'calculated'::text as commission_status,
    result.grid_table as grid_source,
    result.calc_date
  FROM policies p
  LEFT JOIN customers c ON c.id = p.customer_id
  WHERE p.id = result.policy_id;
END;
$function$;