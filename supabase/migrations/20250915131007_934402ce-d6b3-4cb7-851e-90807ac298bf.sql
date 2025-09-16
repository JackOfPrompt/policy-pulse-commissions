-- Add missing columns to existing providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS short_name text,
ADD COLUMN IF NOT EXISTS aliases text[] DEFAULT '{}';

-- Insert sample providers data with correct PostgreSQL array syntax
INSERT INTO providers (name, short_name, code, aliases, provider_type) VALUES
('Tata AIG General Insurance Co. Ltd.', 'Tata AIG', 'TATA_AIG', '{"TATA AIG", "Tata AIG General Insurance", "TATA-AIG"}', 'insurer'),
('HDFC Life Insurance Co. Ltd.', 'HDFC Life', 'HDFC_LIFE', '{"HDFC Life", "HDFC LIFE", "HDFC Life Insurance"}', 'insurer'),
('ICICI Lombard General Insurance Co. Ltd.', 'ICICI Lombard', 'ICICI_LOMBARD', '{"ICICI Lombard", "ICICI LOMBARD", "ICICI Lombard General Insurance"}', 'insurer'),
('Bajaj Allianz General Insurance Co. Ltd.', 'Bajaj Allianz', 'BAJAJ_ALLIANZ', '{"Bajaj Allianz", "BAJAJ ALLIANZ", "Bajaj Allianz General Insurance"}', 'insurer'),
('Star Health and Allied Insurance Co. Ltd.', 'Star Health', 'STAR_HEALTH', '{"Star Health", "STAR HEALTH", "Star Health Insurance"}', 'insurer'),
('New India Assurance Co. Ltd.', 'New India Assurance', 'NEW_INDIA', '{"New India Assurance", "NEW INDIA", "New India Insurance"}', 'insurer'),
('Life Insurance Corporation of India', 'LIC', 'LIC', '{"LIC", "Life Insurance Corporation", "LIC of India"}', 'insurer')
ON CONFLICT (name) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  aliases = EXCLUDED.aliases,
  provider_type = EXCLUDED.provider_type;

-- Update the commission calculation hook to use normalized data
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
    COALESCE(pr.name, p.provider) AS provider,
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
  -- Life using normalized foreign keys when available, fallback to text matching
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
   AND (
     (lpg.provider_id = b.provider_id) OR 
     (lpg.provider_id IS NULL AND lpg.provider = b.provider)
   )
   AND (
     (lpg.product_type_id = b.product_type_id) OR 
     (lpg.product_type_id IS NULL AND lpg.product_type = b.product_category)
   )
   AND (b.premium_amount BETWEEN COALESCE(lpg.premium_start_price,0) AND COALESCE(lpg.premium_end_price,99999999))
   AND lpg.is_active = true
   AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
  WHERE b.product_category = 'life'

  UNION ALL
  -- Health using normalized foreign keys when available, fallback to text matching
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
   AND (
     (hpg.provider_id = b.provider_id) OR 
     (hpg.provider_id IS NULL AND hpg.provider = b.provider)
   )
   AND (
     (hpg.product_type_id = b.product_type_id) OR 
     (hpg.product_type_id IS NULL AND hpg.product_type = b.product_category)
   )
   AND hpg.is_active = true
   AND CURRENT_DATE BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, CURRENT_DATE)
  WHERE b.product_category = 'health'

  UNION ALL
  -- Motor using normalized foreign keys when available, fallback to text matching
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
   AND (
     (mpg.provider_id = b.provider_id) OR 
     (mpg.provider_id IS NULL AND mpg.provider = b.provider)
   )
   AND (
     (mpg.product_type_id = b.product_type_id) OR 
     (mpg.product_type_id IS NULL AND mpg.product_type = b.product_category)
   )
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