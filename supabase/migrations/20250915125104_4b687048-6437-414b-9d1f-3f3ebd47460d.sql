-- Create comprehensive commission calculation function
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_commission_report(
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
    p.source_type,
    p.agent_id,
    p.misp_id,
    p.employee_id,
    COALESCE(p.premium_with_gst, p.premium_without_gst, 0) AS premium_amount
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  WHERE p.policy_status = 'active'
    AND (p_org_id IS NULL OR p.org_id = p_org_id)
    AND (p_policy_id IS NULL OR p.id = p_policy_id)
),
grid_match AS (
  -- Life
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
   AND lpg.provider = b.provider
   AND lpg.product_type = b.product_category
   AND (b.premium_amount BETWEEN COALESCE(lpg.premium_start_price,0) AND COALESCE(lpg.premium_end_price,99999999))
   AND lpg.is_active = true
   AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
  WHERE b.product_category = 'life'

  UNION ALL
  -- Health
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
   AND hpg.provider = b.provider
   AND hpg.product_type = b.product_category
   AND hpg.is_active = true
   AND CURRENT_DATE BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, CURRENT_DATE)
  WHERE b.product_category = 'health'

  UNION ALL
  -- Motor
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
   AND mpg.provider = b.provider
   AND mpg.product_type = b.product_category
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
$function$;

-- Create function to sync commission calculations to policy_commissions table
CREATE OR REPLACE FUNCTION public.sync_comprehensive_commissions(p_org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Insert/update commission records
  FOR commission_rec IN 
    SELECT * FROM calculate_comprehensive_commission_report(p_org_id)
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
$function$;