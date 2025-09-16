-- Fix the product_type issue in the commission distribution function
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

  source_type text := '';
  source_name text := '';
BEGIN
  -- Get policy details with customer and product info
  SELECT 
    p.*,
    pt.category as product_category, -- Use category for product_type
    pt.name as product_name,
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

  -- Resolve premium amount (prefer gross_premium → premium_with_gst → premium_without_gst)
  premium := COALESCE(policy_rec.gross_premium, policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0);

  -- Fetch org commission defaults
  SELECT * INTO org_config_rec FROM org_config WHERE org_id = policy_rec.org_id;

  -- -------------------------------------------------------------------
  -- Match Commission Grid (per product type + provider)
  -- -------------------------------------------------------------------
  IF LOWER(policy_rec.product_category) = 'life' THEN
    SELECT lpg.commission_rate, COALESCE(lpg.reward_rate,0)
    INTO grid_commission_rate, grid_reward_rate
    FROM life_payout_grid lpg
    LEFT JOIN life_policy_details lpd ON lpd.policy_id = policy_rec.id
    WHERE lpg.org_id = policy_rec.org_id
      AND (lpg.provider = policy_rec.provider OR lpg.provider ILIKE '%'||policy_rec.provider||'%' OR policy_rec.provider ILIKE '%'||lpg.provider||'%')
      AND (lpg.product_sub_type IS NULL OR lpg.product_sub_type = COALESCE(lpd.plan_type,''))
      AND (lpg.plan_name IS NULL OR lpg.plan_name = policy_rec.plan_name)
      AND (lpg.premium_start_price IS NULL OR premium >= lpg.premium_start_price)
      AND (lpg.premium_end_price IS NULL OR premium <= lpg.premium_end_price)
    LIMIT 1;
    grid_found := FOUND;
    grid_source_name := 'life_payout_grid';

  ELSIF LOWER(policy_rec.product_category) = 'health' THEN
    SELECT hpg.commission_rate, COALESCE(hpg.reward_rate,0)
    INTO grid_commission_rate, grid_reward_rate
    FROM health_payout_grid hpg
    LEFT JOIN health_policy_details hpd ON hpd.policy_id = policy_rec.id
    WHERE hpg.org_id = policy_rec.org_id
      AND (hpg.provider = policy_rec.provider OR hpg.provider ILIKE '%'||policy_rec.provider||'%' OR policy_rec.provider ILIKE '%'||hpg.provider||'%')
      AND (hpg.plan_name IS NULL OR hpg.plan_name = policy_rec.plan_name)
      AND (hpg.premium_start_price IS NULL OR premium >= hpg.premium_start_price)
      AND (hpg.premium_end_price IS NULL OR premium <= hpg.premium_end_price)
    LIMIT 1;
    grid_found := FOUND;
    grid_source_name := 'health_payout_grid';

  ELSIF LOWER(policy_rec.product_category) = 'motor' THEN
    SELECT mpg.commission_rate, COALESCE(mpg.reward_rate,0)
    INTO grid_commission_rate, grid_reward_rate
    FROM motor_payout_grid mpg
    LEFT JOIN motor_policy_details mpd ON mpd.policy_id = policy_rec.id
    WHERE mpg.org_id = policy_rec.org_id
      AND (mpg.provider = policy_rec.provider OR mpg.provider ILIKE '%'||policy_rec.provider||'%' OR policy_rec.provider ILIKE '%'||mpg.provider||'%')
      AND (mpg.vehicle_make IS NULL OR mpg.vehicle_make = mpd.vehicle_make)
      AND (mpg.vehicle_model IS NULL OR mpg.vehicle_model = mpd.vehicle_model)
      AND (mpg.premium_start_price IS NULL OR premium >= mpg.premium_start_price)
      AND (mpg.premium_end_price IS NULL OR premium <= mpg.premium_end_price)
    LIMIT 1;
    grid_found := FOUND;
    grid_source_name := 'motor_payout_grid';
  END IF;

  IF NOT grid_found THEN
    status := 'no_grid_match';
    grid_commission_rate := 0;
  END IF;

  -- -------------------------------------------------------------------
  -- Calculate Base Commission
  -- -------------------------------------------------------------------
  base_commission_amount := premium * COALESCE(grid_commission_rate,0) / 100;

  -- -------------------------------------------------------------------
  -- Distribution Logic
  -- -------------------------------------------------------------------
  IF policy_rec.agent_id IS NOT NULL THEN
    SELECT * INTO source_rec FROM agents WHERE id = policy_rec.agent_id;
    calculated_agent_rate := COALESCE(source_rec.percentage,0);
    calculated_agent_amount := base_commission_amount * calculated_agent_rate / 100;
    calculated_broker_amount := base_commission_amount - calculated_agent_amount;
    calculated_broker_rate := CASE WHEN base_commission_amount > 0 THEN (calculated_broker_amount * 100 / base_commission_amount) ELSE 0 END;
    source_type := 'agent';
    source_name := COALESCE(source_rec.agent_name, 'Unknown Agent');

  ELSIF policy_rec.misp_id IS NOT NULL THEN
    SELECT * INTO source_rec FROM misps WHERE id = policy_rec.misp_id;
    calculated_misp_rate := COALESCE(source_rec.percentage,50);
    calculated_misp_amount := base_commission_amount * calculated_misp_rate / 100;
    calculated_broker_amount := base_commission_amount - calculated_misp_amount;
    calculated_broker_rate := CASE WHEN base_commission_amount > 0 THEN (calculated_broker_amount * 100 / base_commission_amount) ELSE 0 END;
    source_type := 'misp';
    source_name := COALESCE(source_rec.channel_partner_name, 'Unknown MISP');

  ELSIF policy_rec.employee_id IS NOT NULL THEN
    SELECT * INTO source_rec FROM employees WHERE id = policy_rec.employee_id;
    calculated_employee_rate := COALESCE(org_config_rec.employee_share_percentage,60);
    calculated_employee_amount := base_commission_amount * calculated_employee_rate / 100;
    calculated_broker_amount := base_commission_amount - calculated_employee_amount;
    calculated_broker_rate := CASE WHEN base_commission_amount > 0 THEN (calculated_broker_amount * 100 / base_commission_amount) ELSE 0 END;
    source_type := 'employee';
    source_name := COALESCE(source_rec.name, 'Unknown Employee');

  ELSE
    calculated_broker_amount := base_commission_amount;
    calculated_broker_rate := 100;
    source_type := 'direct';
    source_name := 'Direct';
  END IF;

  -- -------------------------------------------------------------------
  -- Return Result
  -- -------------------------------------------------------------------
  RETURN QUERY SELECT 
    policy_rec.id,
    policy_rec.policy_number,
    policy_rec.product_category, -- Return category as product_type
    TRIM(policy_rec.customer_full_name),
    premium,
    policy_rec.provider,
    source_type,
    source_name,
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