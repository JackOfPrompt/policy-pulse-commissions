-- Fix security linter issues by adding missing percentage column to misps table
ALTER TABLE public.misps 
ADD COLUMN IF NOT EXISTS percentage numeric DEFAULT 50;

-- Update the enhanced commission calculation function with fixed search path
CREATE OR REPLACE FUNCTION public.calculate_policy_commission_enhanced(p_policy_id uuid)
RETURNS TABLE(
  policy_id uuid,
  commission_rate numeric,
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  broker_share numeric,
  commission_status text,
  matched_grid_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  policy_rec record;
  grid_rec record;
  org_config_rec record;
  source_rec record;
  gross_premium numeric := 0;
  calculated_insurer_commission numeric := 0;
  calculated_agent_commission numeric := 0;
  calculated_misp_commission numeric := 0;
  calculated_employee_commission numeric := 0;
  calculated_broker_share numeric := 0;
  status text := 'calculated';
BEGIN
  -- Get policy details with provider and product type
  SELECT 
    p.*,
    pt.category as product_category,
    pt.name as product_name,
    c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name
  INTO policy_rec
  FROM policies p
  LEFT JOIN product_types pt ON pt.id = p.product_type_id
  LEFT JOIN customers c ON c.id = p.customer_id
  WHERE p.id = p_policy_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT p_policy_id, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 'policy_not_found'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Get gross premium (prefer gross_premium, fallback to premium_with_gst, then premium_without_gst)
  gross_premium := COALESCE(policy_rec.gross_premium, policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0);

  -- Get organization config
  SELECT * INTO org_config_rec
  FROM org_config
  WHERE org_id = policy_rec.org_id;

  -- Find matching commission grid by provider_id + product_type + premium range
  SELECT cg.*
  INTO grid_rec
  FROM commission_grids cg
  JOIN providers pr ON pr.id = cg.provider_id
  WHERE cg.org_id = policy_rec.org_id
    AND cg.product_type = policy_rec.product_category
    AND pr.code = policy_rec.provider
    AND (cg.min_premium IS NULL OR gross_premium >= cg.min_premium)
    AND (cg.max_premium IS NULL OR gross_premium <= cg.max_premium)
    AND CURRENT_DATE >= cg.effective_from
    AND (cg.effective_to IS NULL OR CURRENT_DATE <= cg.effective_to)
  ORDER BY cg.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- No matching grid found
    RETURN QUERY SELECT p_policy_id, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 'grid_mismatch'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Calculate base insurer commission
  calculated_insurer_commission := gross_premium * grid_rec.commission_rate / 100;

  -- Distribute commission based on source type
  IF policy_rec.source_type = 'agent' AND policy_rec.agent_id IS NOT NULL THEN
    -- Get agent details
    SELECT * INTO source_rec FROM agents WHERE id = policy_rec.agent_id;
    
    IF source_rec.percentage IS NOT NULL THEN
      calculated_agent_commission := calculated_insurer_commission * source_rec.percentage / 100;
      calculated_broker_share := calculated_insurer_commission - calculated_agent_commission;
    ELSE
      status := 'config_missing';
    END IF;
    
  ELSIF policy_rec.source_type = 'misp' AND policy_rec.misp_id IS NOT NULL THEN
    -- Get MISP details
    SELECT percentage INTO source_rec FROM misps WHERE id = policy_rec.misp_id;
    
    IF source_rec IS NOT NULL THEN
      calculated_misp_commission := calculated_insurer_commission * COALESCE(source_rec, 50) / 100;
      calculated_broker_share := calculated_insurer_commission - calculated_misp_commission;
    ELSE
      status := 'config_missing';
    END IF;
    
  ELSIF policy_rec.source_type = 'employee' AND policy_rec.employee_id IS NOT NULL THEN
    -- Use organization employee share percentage
    IF org_config_rec.employee_share_percentage IS NOT NULL THEN
      calculated_employee_commission := calculated_insurer_commission * org_config_rec.employee_share_percentage / 100;
      calculated_broker_share := calculated_insurer_commission - calculated_employee_commission;
    ELSE
      -- Default to 60% if no config
      calculated_employee_commission := calculated_insurer_commission * 60 / 100;
      calculated_broker_share := calculated_insurer_commission - calculated_employee_commission;
    END IF;
    
  ELSE
    -- Direct org sale - all goes to broker
    calculated_broker_share := calculated_insurer_commission;
  END IF;

  RETURN QUERY SELECT 
    p_policy_id,
    grid_rec.commission_rate,
    calculated_insurer_commission,
    calculated_agent_commission,
    calculated_misp_commission,
    calculated_employee_commission,
    calculated_broker_share,
    status,
    grid_rec.id;
END;
$$;

-- Function to save enhanced commission calculation
CREATE OR REPLACE FUNCTION public.save_policy_commission_enhanced(
  p_policy_id uuid,
  p_insurer_commission numeric,
  p_agent_commission numeric DEFAULT 0,
  p_misp_commission numeric DEFAULT 0,
  p_employee_commission numeric DEFAULT 0,
  p_broker_share numeric DEFAULT 0,
  p_commission_rate numeric DEFAULT 0,
  p_grid_id uuid DEFAULT NULL,
  p_status text DEFAULT 'calculated'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  policy_org_id uuid;
  policy_product_type text;
BEGIN
  -- Get policy org_id and product_type
  SELECT p.org_id, pt.category 
  INTO policy_org_id, policy_product_type
  FROM policies p
  JOIN product_types pt ON pt.id = p.product_type_id
  WHERE p.id = p_policy_id;

  -- Insert or update policy commission
  INSERT INTO policy_commissions (
    policy_id,
    org_id,
    product_type,
    commission_rate,
    insurer_commission,
    agent_commission,
    misp_commission,
    employee_commission,
    broker_share,
    grid_id,
    commission_status,
    total_amount
  )
  VALUES (
    p_policy_id,
    policy_org_id,
    policy_product_type,
    p_commission_rate,
    p_insurer_commission,
    p_agent_commission,
    p_misp_commission,
    p_employee_commission,
    p_broker_share,
    p_grid_id,
    p_status,
    p_insurer_commission
  )
  ON CONFLICT (policy_id) 
  WHERE is_active = true
  DO UPDATE SET
    commission_rate = p_commission_rate,
    insurer_commission = p_insurer_commission,
    agent_commission = p_agent_commission,
    misp_commission = p_misp_commission,
    employee_commission = p_employee_commission,
    broker_share = p_broker_share,
    grid_id = p_grid_id,
    commission_status = p_status,
    total_amount = p_insurer_commission,
    updated_at = NOW();

  RETURN true;
END;
$$;