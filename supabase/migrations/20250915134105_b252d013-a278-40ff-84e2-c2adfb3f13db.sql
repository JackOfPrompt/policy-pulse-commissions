-- 1) Make grid matching robust in comprehensive report
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
    p.provider_id,
    p.source_type,
    p.agent_id,
    p.misp_id,
    p.employee_id,
    COALESCE(p.premium_with_gst, p.premium_without_gst, 0) AS premium_amount,
    COALESCE(p.issue_date, p.start_date, CURRENT_DATE) AS match_date
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  WHERE p.policy_status = 'active'
    AND (p_org_id IS NULL OR p.org_id = p_org_id)
    AND (p_policy_id IS NULL OR p.id = p_policy_id)
),
grid_match AS (
  -- Life matching using product name and provider_id fallback to case-insensitive name
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
        (lpg.premium_start_price IS NULL AND lpg.premium_end_price IS NULL)
        OR (b.premium_amount BETWEEN COALESCE(lpg.premium_start_price, 0) AND COALESCE(lpg.premium_end_price, 999999999))
       )
   AND lpg.is_active = true
   AND b.match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, b.match_date)
  WHERE lower(b.product_name) = 'life'

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
   AND hpg.product_type = b.product_name
   AND (
         (hpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND hpg.provider_id = b.provider_id)
      OR (hpg.provider_id IS NULL AND b.provider_id IS NULL AND lower(hpg.provider) = lower(COALESCE(b.provider, '')))
       )
   AND hpg.is_active = true
   AND b.match_date BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, b.match_date)
  WHERE lower(b.product_name) = 'health'

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
   AND mpg.product_type = b.product_name
   AND (
         (mpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND mpg.provider_id = b.provider_id)
      OR (mpg.provider_id IS NULL AND b.provider_id IS NULL AND lower(mpg.provider) = lower(COALESCE(b.provider, '')))
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

-- 2) Improve provider/date/product matching in enhanced commission distribution
CREATE OR REPLACE FUNCTION public.calculate_enhanced_commission_distribution(p_policy_id uuid)
RETURNS TABLE(
  policy_id uuid,
  policy_number text,
  product_type text,
  customer_name text,
  premium_amount numeric,
  provider text,
  source_type text,
  source_name text,
  insurer_commission_rate numeric,
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
  policy_rec record;
  org_config_rec record;
  source_rec record;

  premium numeric := 0;
  sum_insured numeric := 0;
  grid_commission_rate numeric := 0;
  grid_reward_rate numeric := 0;
  grid_found boolean := false;

  base_commission_amount numeric := 0;

  calculated_agent_rate numeric := 0;
  calculated_agent_amount numeric := 0;
  calculated_misp_rate numeric := 0;
  calculated_misp_amount numeric := 0;
  calculated_employee_rate numeric := 0;
  calculated_employee_amount numeric := 0;
  calculated_broker_rate numeric := 0;
  calculated_broker_amount numeric := 0;

  status text := 'calculated';
  grid_source_name text := '';

  src_type text := '';
  src_name text := '';
  v_match_date date;
BEGIN
  -- Get policy details with customer and product info using product_types.name
  SELECT 
    p.*, pt.name as product_name,
    CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_full_name
  INTO policy_rec
  FROM policies p
  LEFT JOIN product_types pt ON pt.id = p.product_type_id
  LEFT JOIN customers c ON c.id = p.customer_id
  WHERE p.id = p_policy_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      p_policy_id, ''::text, ''::text, ''::text, 0::numeric, ''::text, ''::text, ''::text,
      0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric,
      0::numeric, 0::numeric, 0::numeric, 0::numeric, 'policy_not_found'::text, ''::text, NOW();
    RETURN;
  END IF;

  v_match_date := COALESCE(policy_rec.issue_date, policy_rec.start_date, CURRENT_DATE);

  -- Resolve premium amount and sum insured
  premium := COALESCE(policy_rec.gross_premium, policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0);
  sum_insured := COALESCE((policy_rec.dynamic_details->>'sum_insured')::numeric, 0);

  -- Fetch org commission defaults
  SELECT * INTO org_config_rec FROM org_config WHERE org_id = policy_rec.org_id;

  -- -------------------------------------------------------------------
  -- Match Commission Grid (per product name + provider with id fallback)
  -- -------------------------------------------------------------------
  IF LOWER(policy_rec.product_name) = 'life' THEN
    SELECT lpg.commission_rate, COALESCE(lpg.reward_rate,0)
    INTO grid_commission_rate, grid_reward_rate
    FROM life_payout_grid lpg
    LEFT JOIN life_policy_details lpd ON lpd.policy_id = policy_rec.id
    WHERE lpg.org_id = policy_rec.org_id
      AND lpg.product_type = policy_rec.product_name
      AND (
            (lpg.provider_id IS NOT NULL AND policy_rec.provider_id IS NOT NULL AND lpg.provider_id = policy_rec.provider_id)
         OR (lpg.provider_id IS NULL AND policy_rec.provider_id IS NULL AND lower(lpg.provider) = lower(COALESCE(policy_rec.provider,'')))
          )
      AND (lpg.product_sub_type IS NULL OR lpg.product_sub_type = COALESCE(lpd.plan_type,''))
      AND (lpg.plan_name IS NULL OR lpg.plan_name = policy_rec.plan_name)
      AND (lpg.ppt IS NULL OR lpg.ppt = COALESCE(lpd.premium_payment_term, 0))
      AND (lpg.pt IS NULL OR lpg.pt = COALESCE(lpd.policy_term, 0))
      AND (
        (lpg.premium_start_price IS NULL AND lpg.premium_end_price IS NULL)
        OR (premium BETWEEN COALESCE(lpg.premium_start_price, 0) AND COALESCE(lpg.premium_end_price, 999999999))
      )
      AND lpg.is_active = true
      AND v_match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, v_match_date)
    ORDER BY lpg.created_at DESC
    LIMIT 1;
    grid_found := FOUND;
    grid_source_name := 'life_payout_grid';

  ELSIF LOWER(policy_rec.product_name) = 'health' THEN
    SELECT hpg.commission_rate, COALESCE(hpg.reward_rate,0)
    INTO grid_commission_rate, grid_reward_rate
    FROM health_payout_grid hpg
    LEFT JOIN health_policy_details hpd ON hpd.policy_id = policy_rec.id
    WHERE hpg.org_id = policy_rec.org_id
      AND hpg.product_type = policy_rec.product_name
      AND (
            (hpg.provider_id IS NOT NULL AND policy_rec.provider_id IS NOT NULL AND hpg.provider_id = policy_rec.provider_id)
         OR (hpg.provider_id IS NULL AND policy_rec.provider_id IS NULL AND lower(hpg.provider) = lower(COALESCE(policy_rec.provider,'')))
          )
      AND (hpg.product_sub_type = COALESCE(hpd.policy_type, hpg.product_sub_type))
      AND (hpg.plan_name IS NULL OR hpg.plan_name = policy_rec.plan_name)
      AND (
        (hpg.sum_insured_min IS NULL AND hpg.sum_insured_max IS NULL)
        OR (sum_insured BETWEEN COALESCE(hpg.sum_insured_min, 0) AND COALESCE(hpg.sum_insured_max, 999999999))
      )
      AND hpg.is_active = true
      AND v_match_date BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, v_match_date)
    ORDER BY hpg.created_at DESC
    LIMIT 1;
    grid_found := FOUND;
    grid_source_name := 'health_payout_grid';

  ELSIF LOWER(policy_rec.product_name) = 'motor' THEN
    SELECT mpg.commission_rate, COALESCE(mpg.reward_rate,0)
    INTO grid_commission_rate, grid_reward_rate
    FROM motor_payout_grid mpg
    JOIN motor_policy_details mpd ON mpd.policy_id = policy_rec.id
    LEFT JOIN vehicles v ON v.id = mpd.vehicle_id
    WHERE mpg.product_type = policy_rec.product_name
      AND mpg.product_subtype = COALESCE(mpd.policy_sub_type, (SELECT name FROM product_types WHERE id = policy_rec.product_type_id))
      AND (
            (mpg.provider_id IS NOT NULL AND policy_rec.provider_id IS NOT NULL AND mpg.provider_id = policy_rec.provider_id)
         OR (mpg.provider_id IS NULL AND policy_rec.provider_id IS NULL AND lower(mpg.provider) = lower(COALESCE(policy_rec.provider,'')))
          )
      AND (mpg.vehicle_make IS NULL OR mpg.vehicle_make = COALESCE(v.make, ''))
      AND (mpg.fuel_type_id IS NULL OR mpg.fuel_type_id::text = COALESCE(v.fuel_type, ''))
      AND (mpg.cc_range IS NULL OR mpg.cc_range = COALESCE(v.cc::text, ''))
      AND (mpg.ncb_percentage IS NULL OR mpg.ncb_percentage = COALESCE(mpd.ncb, 0))
      AND (mpg.coverage_type_id IS NULL OR mpg.coverage_type_id::text = COALESCE(mpd.policy_type, ''))
      AND mpg.is_active = true
      AND v_match_date BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, v_match_date)
    ORDER BY mpg.created_at DESC
    LIMIT 1;
    grid_found := FOUND;
    grid_source_name := 'motor_payout_grid';
  END IF;

  IF NOT grid_found THEN
    status := 'no_grid_match';
    grid_commission_rate := 0;
  END IF;

  -- Calculate Base Commission
  base_commission_amount := premium * COALESCE(grid_commission_rate,0) / 100;

  -- Distribution Logic
  IF policy_rec.agent_id IS NOT NULL THEN
    SELECT * INTO source_rec FROM agents WHERE id = policy_rec.agent_id;
    calculated_agent_rate := COALESCE(source_rec.percentage,0);
    calculated_agent_amount := base_commission_amount * calculated_agent_rate / 100;
    calculated_broker_amount := base_commission_amount - calculated_agent_amount;
    calculated_broker_rate := CASE WHEN base_commission_amount > 0 THEN (calculated_broker_amount * 100 / base_commission_amount) ELSE 0 END;
    src_type := 'agent';
    src_name := COALESCE(source_rec.agent_name, 'Unknown Agent');

  ELSIF policy_rec.misp_id IS NOT NULL THEN
    SELECT * INTO source_rec FROM misps WHERE id = policy_rec.misp_id;
    calculated_misp_rate := COALESCE(source_rec.percentage,50);
    calculated_misp_amount := base_commission_amount * calculated_misp_rate / 100;
    calculated_broker_amount := base_commission_amount - calculated_misp_amount;
    calculated_broker_rate := CASE WHEN base_commission_amount > 0 THEN (calculated_broker_amount * 100 / base_commission_amount) ELSE 0 END;
    src_type := 'misp';
    src_name := COALESCE(source_rec.channel_partner_name, 'Unknown MISP');

  ELSIF policy_rec.employee_id IS NOT NULL THEN
    SELECT * INTO source_rec FROM employees WHERE id = policy_rec.employee_id;
    calculated_employee_rate := COALESCE(org_config_rec.employee_share_percentage,60);
    calculated_employee_amount := base_commission_amount * calculated_employee_rate / 100;
    calculated_broker_amount := base_commission_amount - calculated_employee_amount;
    calculated_broker_rate := CASE WHEN base_commission_amount > 0 THEN (calculated_broker_amount * 100 / base_commission_amount) ELSE 0 END;
    src_type := 'employee';
    src_name := COALESCE(source_rec.name, 'Unknown Employee');

  ELSE
    calculated_broker_amount := base_commission_amount;
    calculated_broker_rate := CASE WHEN base_commission_amount > 0 THEN 100 ELSE 0 END;
    src_type := 'direct';
    src_name := 'Direct';
  END IF;

  -- Return Result
  RETURN QUERY SELECT 
    policy_rec.id,
    policy_rec.policy_number,
    policy_rec.product_name,
    TRIM(policy_rec.customer_full_name),
    premium,
    policy_rec.provider,
    src_type,
    src_name,
    grid_commission_rate,
    base_commission_amount,
    calculated_agent_rate,
    calculated_agent_amount,
    calculated_misp_rate,
    calculated_misp_amount,
    calculated_employee_rate,
    calculated_employee_amount,
    calculated_broker_rate,
    calculated_broker_amount,
    status,
    grid_source_name,
    NOW();
END;
$function$;