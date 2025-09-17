-- Replace calculate_commission_splits to use payout grid tables instead of commission_grids
CREATE OR REPLACE FUNCTION public.calculate_commission_splits(p_policy_id uuid)
RETURNS TABLE(
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  broker_share numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  policy_rec RECORD;
  grid_rate numeric := 0;
  premium_amount numeric := 0;
  total_commission numeric := 0;
  agent_rate numeric := 70;      -- default agent share %
  misp_rate numeric := 75;       -- default misp share %
  employee_rate numeric := 60;   -- default employee share %
BEGIN
  -- Get policy details (with product category and provider as text)
  SELECT p.*, pt.category AS product_category, pt.name AS product_name
  INTO policy_rec
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  WHERE p.id = p_policy_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric;
    RETURN;
  END IF;

  premium_amount := COALESCE(policy_rec.premium_with_gst, policy_rec.premium_without_gst, policy_rec.gross_premium, 0);

  -- Resolve commission rate from payout grids based on product category
  IF lower(policy_rec.product_category) = 'life' THEN
    SELECT COALESCE(lpg.commission_rate, 0)
    INTO grid_rate
    FROM life_payout_grid lpg
    WHERE lpg.org_id = policy_rec.org_id
      AND lpg.provider = policy_rec.provider
      AND lower(lpg.product_type) = lower(policy_rec.product_category)
      AND (lpg.min_premium IS NULL OR premium_amount >= lpg.min_premium)
      AND (lpg.max_premium IS NULL OR premium_amount <= lpg.max_premium)
      AND lpg.is_active = true
      AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
    ORDER BY lpg.created_at DESC
    LIMIT 1;

  ELSIF lower(policy_rec.product_category) = 'health' THEN
    SELECT COALESCE(hpg.commission_rate, 0)
    INTO grid_rate
    FROM health_payout_grid hpg
    WHERE hpg.org_id = policy_rec.org_id
      AND hpg.provider = policy_rec.provider
      AND lower(hpg.product_type) = lower(policy_rec.product_category)
      AND (hpg.min_premium IS NULL OR premium_amount >= hpg.min_premium)
      AND (hpg.max_premium IS NULL OR premium_amount <= hpg.max_premium)
      AND hpg.is_active = true
      AND CURRENT_DATE BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, CURRENT_DATE)
    ORDER BY hpg.created_at DESC
    LIMIT 1;

  ELSIF lower(policy_rec.product_category) = 'motor' THEN
    SELECT COALESCE(mpg.commission_rate, 0)
    INTO grid_rate
    FROM motor_payout_grid mpg
    WHERE mpg.org_id = policy_rec.org_id
      AND mpg.provider = policy_rec.provider
      AND lower(mpg.product_type) = lower(policy_rec.product_category)
      AND (mpg.min_premium IS NULL OR premium_amount >= mpg.min_premium)
      AND (mpg.max_premium IS NULL OR premium_amount <= mpg.max_premium)
      AND mpg.is_active = true
      AND CURRENT_DATE BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, CURRENT_DATE)
    ORDER BY mpg.created_at DESC
    LIMIT 1;
  END IF;

  -- Calculate total commission from insurer
  total_commission := premium_amount * COALESCE(grid_rate, 0) / 100;

  -- Initialize outputs
  insurer_commission := total_commission;
  agent_commission := 0; 
  misp_commission := 0;
  employee_commission := 0;
  broker_share := 0;

  -- Split based on source type
  IF policy_rec.source_type = 'agent' AND policy_rec.agent_id IS NOT NULL THEN
    -- If override_percentage exists, prefer it; else use percentage; default to 70
    SELECT COALESCE(override_percentage, percentage, agent_rate) INTO agent_rate FROM agents WHERE id = policy_rec.agent_id;
    agent_commission := total_commission * agent_rate / 100;
    broker_share := total_commission - agent_commission;

  ELSIF policy_rec.source_type = 'misp' AND policy_rec.misp_id IS NOT NULL THEN
    SELECT COALESCE(override_percentage, percentage, misp_rate) INTO misp_rate FROM misps WHERE id = policy_rec.misp_id;
    misp_commission := total_commission * misp_rate / 100;
    broker_share := total_commission - misp_commission;

  ELSIF policy_rec.source_type = 'employee' AND policy_rec.employee_id IS NOT NULL THEN
    -- If org_config has a setting, use it; else default to 60
    SELECT COALESCE(employee_share_percentage, employee_rate) INTO employee_rate 
    FROM org_config WHERE org_id = policy_rec.org_id;
    employee_commission := total_commission * employee_rate / 100;
    broker_share := total_commission - employee_commission;

  ELSE
    -- Direct sale
    broker_share := total_commission;
  END IF;

  RETURN QUERY SELECT 
    COALESCE(insurer_commission, 0)::numeric,
    COALESCE(agent_commission, 0)::numeric,
    COALESCE(misp_commission, 0)::numeric,
    COALESCE(employee_commission, 0)::numeric,
    COALESCE(broker_share, 0)::numeric;
END;
$function$;