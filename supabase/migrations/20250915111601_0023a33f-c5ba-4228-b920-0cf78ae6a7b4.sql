-- Enhanced commission calculation function that uses the existing payout grids
-- and implements proper distribution for internal vs external policies
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
SET search_path = 'public'
AS $$
DECLARE
  policy_rec record;
  grid_rec record;
  org_config_rec record;
  source_rec record;
  premium numeric := 0;
  base_commission_rate numeric := 0;
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
BEGIN
  -- Get policy details with customer and product info
  SELECT 
    p.*,
    pt.category as product_category,
    pt.name as product_name,
    c.first_name || ' ' || COALESCE(c.last_name, '') as customer_full_name
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

  -- Get premium amount (prefer gross_premium, then premium_with_gst, then premium_without_gst)
  premium := COALESCE(policy_rec.gross_premium, policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0);

  -- Get organization config for default rates
  SELECT * INTO org_config_rec FROM org_config WHERE org_id = policy_rec.org_id;

  -- Find matching commission grid based on product type
  IF policy_rec.product_category = 'life' THEN
    SELECT 
      lpg.commission_rate,
      COALESCE(lpg.reward_rate, 0) as reward_rate,
      lpg.id
    INTO grid_rec
    FROM life_payout_grid lpg
    LEFT JOIN life_policy_details lpd ON lpd.policy_id = policy_rec.id
    WHERE lpg.org_id = policy_rec.org_id
      AND lpg.product_type = policy_rec.product_category
      AND lpg.provider = policy_rec.provider
      AND (lpg.product_sub_type IS NULL OR lpg.product_sub_type = COALESCE(lpd.plan_type, ''))
      AND (lpg.plan_name IS NULL OR lpg.plan_name = policy_rec.plan_name)
      AND (lpg.premium_start_price IS NULL OR premium >= lpg.premium_start_price)
      AND (lpg.premium_end_price IS NULL OR premium <= lpg.premium_end_price)
      AND lpg.is_active = true
      AND CURRENT_DATE >= lpg.commission_start_date
      AND (lpg.commission_end_date IS NULL OR CURRENT_DATE <= lpg.commission_end_date)
    ORDER BY lpg.created_at DESC
    LIMIT 1;
    
    grid_source_name := 'life_payout_grid';

  ELSIF policy_rec.product_category = 'health' THEN
    SELECT 
      hpg.commission_rate,
      COALESCE(hpg.reward_rate, 0) as reward_rate,
      hpg.id
    INTO grid_rec
    FROM health_payout_grid hpg
    LEFT JOIN health_policy_details hpd ON hpd.policy_id = policy_rec.id
    WHERE hpg.org_id = policy_rec.org_id
      AND hpg.product_type = policy_rec.product_category
      AND hpg.provider = policy_rec.provider
      AND hpg.plan_name = policy_rec.plan_name
      AND (hpg.product_sub_type = COALESCE(hpd.policy_type, ''))
      AND hpg.is_active = true
      AND CURRENT_DATE >= hpg.valid_from
      AND (hpg.valid_to IS NULL OR CURRENT_DATE <= hpg.valid_to)
    ORDER BY hpg.created_at DESC
    LIMIT 1;
    
    grid_source_name := 'health_payout_grid';

  ELSIF policy_rec.product_category = 'motor' THEN
    SELECT 
      mpg.commission_rate,
      COALESCE(mpg.reward_rate, 0) as reward_rate,
      mpg.id
    INTO grid_rec
    FROM motor_payout_grid mpg
    LEFT JOIN motor_policy_details mpd ON mpd.policy_id = policy_rec.id
    WHERE mpg.org_id = policy_rec.org_id
      AND mpg.product_type = policy_rec.product_category
      AND mpg.provider = policy_rec.provider
      AND (mpg.product_subtype = COALESCE(mpd.policy_sub_type, ''))
      AND mpg.is_active = true
      AND CURRENT_DATE >= mpg.valid_from
      AND (mpg.valid_to IS NULL OR CURRENT_DATE <= mpg.valid_to)
    ORDER BY mpg.created_at DESC
    LIMIT 1;
    
    grid_source_name := 'motor_payout_grid';
  END IF;

  -- If no grid found, use default org commission rate
  IF grid_rec.commission_rate IS NULL THEN
    base_commission_rate := COALESCE(org_config_rec.default_commission_rate, 0);
    status := 'default_rate_used';
  ELSE
    base_commission_rate := grid_rec.commission_rate + COALESCE(grid_rec.reward_rate, 0);
  END IF;

  -- Calculate base commission amount from insurer
  base_commission_amount := premium * base_commission_rate / 100;

  -- Distribute commission based on source type and agent tier
  IF policy_rec.source_type = 'agent' AND policy_rec.agent_id IS NOT NULL THEN
    -- Get agent details and percentage
    SELECT 
      a.agent_name,
      COALESCE(a.percentage, 70) as agent_percentage -- Default 70% if not set
    INTO source_rec
    FROM agents a 
    WHERE a.id = policy_rec.agent_id;
    
    IF source_rec IS NOT NULL THEN
      calculated_agent_rate := source_rec.agent_percentage;
      calculated_agent_amount := base_commission_amount * calculated_agent_rate / 100;
      calculated_broker_rate := 100 - calculated_agent_rate;
      calculated_broker_amount := base_commission_amount - calculated_agent_amount;
    ELSE
      status := 'agent_not_found';
    END IF;

  ELSIF policy_rec.source_type = 'misp' AND policy_rec.misp_id IS NOT NULL THEN
    -- Get MISP details and percentage
    SELECT 
      m.channel_partner_name,
      COALESCE(m.percentage, 75) as misp_percentage -- Default 75% if not set
    INTO source_rec
    FROM misps m 
    WHERE m.id = policy_rec.misp_id;
    
    IF source_rec IS NOT NULL THEN
      calculated_misp_rate := source_rec.misp_percentage;
      calculated_misp_amount := base_commission_amount * calculated_misp_rate / 100;
      calculated_broker_rate := 100 - calculated_misp_rate;
      calculated_broker_amount := base_commission_amount - calculated_misp_amount;
    ELSE
      status := 'misp_not_found';
    END IF;

  ELSIF policy_rec.source_type = 'employee' AND policy_rec.employee_id IS NOT NULL THEN
    -- Get employee details and use org employee share percentage
    SELECT e.name INTO source_rec FROM employees e WHERE e.id = policy_rec.employee_id;
    
    calculated_employee_rate := COALESCE(org_config_rec.employee_share_percentage, 60); -- Default 60%
    calculated_employee_amount := base_commission_amount * calculated_employee_rate / 100;
    calculated_broker_rate := COALESCE(org_config_rec.broker_share_percentage, 40); -- Default 40%
    calculated_broker_amount := base_commission_amount - calculated_employee_amount;

  ELSE
    -- Direct sale - all goes to broker
    calculated_broker_rate := 100;
    calculated_broker_amount := base_commission_amount;
    source_rec := 'Direct Sale';
  END IF;

  RETURN QUERY SELECT 
    p_policy_id,
    policy_rec.policy_number,
    policy_rec.product_category,
    policy_rec.customer_full_name,
    premium,
    policy_rec.provider,
    COALESCE(policy_rec.source_type, 'direct'),
    COALESCE(source_rec, 'Direct Sale'),
    base_commission_rate,
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
$$;

-- Function to get commission distribution report for all policies in an org
CREATE OR REPLACE FUNCTION public.get_commission_distribution_report(
  p_org_id uuid DEFAULT NULL,
  p_product_type text DEFAULT NULL,
  p_commission_status text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
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
SET search_path = 'public'
AS $$
DECLARE
  policy_record record;
  current_org_id uuid;
BEGIN
  -- Get current user's org if not provided
  IF p_org_id IS NULL THEN
    SELECT org_id INTO current_org_id
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    LIMIT 1;
  ELSE
    current_org_id := p_org_id;
  END IF;

  -- Loop through policies and calculate commission distribution
  FOR policy_record IN 
    SELECT p.id
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    WHERE p.org_id = current_org_id
      AND p.policy_status = 'active'
      AND (p_product_type IS NULL OR pt.category = p_product_type)
      AND (p_date_from IS NULL OR p.created_at::date >= p_date_from)
      AND (p_date_to IS NULL OR p.created_at::date <= p_date_to)
    ORDER BY p.created_at DESC
  LOOP
    RETURN QUERY 
    SELECT * FROM calculate_enhanced_commission_distribution(policy_record.id);
  END LOOP;
END;
$$;