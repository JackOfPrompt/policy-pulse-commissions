-- Drop the existing view first
DROP VIEW IF EXISTS public.policy_commission_distribution_view;

-- Create the new view with updated structure
CREATE VIEW public.policy_commission_distribution_view AS
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
    COALESCE(p.premium_with_gst, p.premium_without_gst, 0) AS premium_amount,
    COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)) AS customer_name
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  JOIN customers c ON c.id = p.customer_id
  WHERE p.policy_status = 'active'
),
grid_match AS (
  -- Life
  SELECT 
    b.policy_id,
    lpg.id AS grid_id,
    'life_payout_grid' AS grid_table,
    lpg.commission_rate,
    COALESCE(lpg.reward_rate, 0) AS reward_rate,
    b.premium_amount
  FROM base b
  JOIN life_payout_grid lpg 
    ON lpg.org_id = b.org_id
   AND lpg.provider = b.provider
   AND lpg.product_type = b.product_category
   AND (b.premium_amount BETWEEN COALESCE(lpg.premium_start_price,0) AND COALESCE(lpg.premium_end_price,99999999))
   AND lpg.is_active = true
   AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)

  UNION ALL
  -- Health
  SELECT 
    b.policy_id,
    hpg.id AS grid_id,
    'health_payout_grid' AS grid_table,
    hpg.commission_rate,
    COALESCE(hpg.reward_rate, 0) AS reward_rate,
    b.premium_amount
  FROM base b
  JOIN health_payout_grid hpg
    ON hpg.org_id = b.org_id
   AND hpg.provider = b.provider
   AND hpg.product_type = b.product_category
   AND hpg.is_active = true
   AND CURRENT_DATE BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, CURRENT_DATE)

  UNION ALL
  -- Motor
  SELECT 
    b.policy_id,
    mpg.id AS grid_id,
    'motor_payout_grid' AS grid_table,
    mpg.commission_rate,
    COALESCE(mpg.reward_rate, 0) AS reward_rate,
    b.premium_amount
  FROM base b
  JOIN motor_payout_grid mpg
    ON mpg.org_id = b.org_id
   AND mpg.provider = b.provider
   AND mpg.product_type = b.product_category
   AND mpg.is_active = true
   AND CURRENT_DATE BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, CURRENT_DATE)
)
SELECT 
  b.policy_id,
  b.policy_number,
  b.product_category AS product_type,
  b.customer_name,
  b.premium_amount,
  b.provider,
  b.source_type,
  CASE 
    WHEN b.source_type = 'agent' THEN 'Agent'
    WHEN b.source_type = 'misp' THEN 'MISP Dealer'
    WHEN b.source_type = 'employee' THEN 'Employee'
    ELSE 'Direct'
  END AS source_name,
  g.grid_table AS grid_source,
  g.commission_rate AS insurer_commission_rate,
  (b.premium_amount * g.commission_rate / 100) AS insurer_commission_amount,
  g.commission_rate AS agent_commission_rate,
  CASE 
    WHEN b.source_type = 'agent' THEN (b.premium_amount * g.commission_rate / 100) * 0.7
    ELSE 0
  END AS agent_commission_amount,
  g.commission_rate AS misp_commission_rate,
  CASE 
    WHEN b.source_type = 'misp' THEN (b.premium_amount * g.commission_rate / 100) * 0.5
    ELSE 0
  END AS misp_commission_amount,
  g.commission_rate AS employee_commission_rate,
  CASE 
    WHEN b.source_type = 'employee' THEN (b.premium_amount * g.commission_rate / 100) * 0.6
    ELSE 0
  END AS employee_commission_amount,
  g.commission_rate AS broker_share_rate,
  -- Broker gets whatever is left
  (b.premium_amount * g.commission_rate / 100)
   - (
      CASE WHEN b.source_type = 'agent' THEN (b.premium_amount * g.commission_rate / 100) * 0.7 ELSE 0 END +
      CASE WHEN b.source_type = 'misp' THEN (b.premium_amount * g.commission_rate / 100) * 0.5 ELSE 0 END +
      CASE WHEN b.source_type = 'employee' THEN (b.premium_amount * g.commission_rate / 100) * 0.6 ELSE 0 END
     ) AS broker_share_amount,
  now()::timestamp AS calc_date,
  'calculated'::text AS commission_status
FROM base b
JOIN grid_match g ON g.policy_id = b.policy_id;