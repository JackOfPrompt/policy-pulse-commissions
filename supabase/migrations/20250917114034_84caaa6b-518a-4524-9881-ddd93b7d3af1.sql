-- Create the missing enhanced comprehensive commission calculation function
CREATE OR REPLACE FUNCTION calculate_enhanced_comprehensive_commission_report(p_org_id uuid DEFAULT NULL, p_policy_id uuid DEFAULT NULL)
RETURNS TABLE(
  policy_id uuid,
  policy_number text,
  customer_name text,
  product_category text,
  product_name text,
  plan_name text,
  provider text,
  premium_amount numeric,
  source_type text,
  employee_id uuid,
  employee_name text,
  employee_code text,
  agent_id uuid,
  agent_name text,
  agent_code text,
  misp_id uuid,
  misp_name text,
  channel_partner_name text,
  grid_table text,
  grid_id uuid,
  base_commission_rate numeric,
  reward_commission_rate numeric,
  bonus_commission_rate numeric,
  total_commission_rate numeric,
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  reporting_employee_commission numeric,
  broker_share numeric,
  commission_status text,
  calc_date timestamp with time zone,
  policy_start_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  policy_rec RECORD;
  org_config_rec RECORD;
  grid_rec RECORD;
  commission_splits RECORD;
  
  premium numeric := 0;
  sum_insured numeric := 0;
  
  calculated_base_rate numeric := 0;
  calculated_reward_rate numeric := 0;
  calculated_bonus_rate numeric := 0;
  calculated_total_rate numeric := 0;
  
  calculated_insurer_commission numeric := 0;
  calculated_agent_commission numeric := 0;
  calculated_misp_commission numeric := 0;
  calculated_employee_commission numeric := 0;
  calculated_reporting_employee_commission numeric := 0;
  calculated_broker_share numeric := 0;
  
  agent_percentage numeric := 0;
  misp_percentage numeric := 50;
  employee_share_percentage numeric := 60;
  broker_share_percentage numeric := 40;
BEGIN
  -- Get organization configuration
  SELECT * INTO org_config_rec 
  FROM org_config 
  WHERE org_id = p_org_id;
  
  -- Use config values if available
  IF org_config_rec IS NOT NULL THEN
    employee_share_percentage := COALESCE(org_config_rec.employee_share_percentage, 60);
    broker_share_percentage := COALESCE(org_config_rec.broker_share_percentage, 40);
  END IF;

  -- Loop through policies
  FOR policy_rec IN
    SELECT 
      p.id,
      p.policy_number,
      p.source_type,
      p.employee_id,
      p.agent_id,
      p.misp_id,
      p.start_date,
      p.created_at,
      COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) as premium_amount,
      COALESCE((p.dynamic_details->>'sum_insured')::numeric, 0) as sum_insured,
      p.provider,
      p.plan_name,
      pt.category as product_category,
      pt.name as product_name,
      CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
      e.name as employee_name,
      e.employee_code,
      a.agent_name,
      a.agent_code,
      COALESCE(a.override_percentage, a.base_percentage) as agent_percentage,
      m.channel_partner_name as misp_name,
      m.percentage as misp_percentage
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN employees e ON e.id = p.employee_id
    LEFT JOIN agents a ON a.id = p.agent_id
    LEFT JOIN misps m ON m.id = p.misp_id
    WHERE p.org_id = p_org_id
      AND p.policy_status = 'active'
      AND (p_policy_id IS NULL OR p.id = p_policy_id)
  LOOP
    -- Reset calculations for each policy
    calculated_base_rate := 0;
    calculated_reward_rate := 0;
    calculated_bonus_rate := 0;
    calculated_total_rate := 0;
    calculated_insurer_commission := 0;
    calculated_agent_commission := 0;
    calculated_misp_commission := 0;
    calculated_employee_commission := 0;
    calculated_reporting_employee_commission := 0;
    calculated_broker_share := 0;
    
    premium := policy_rec.premium_amount;
    sum_insured := policy_rec.sum_insured;
    
    -- Find matching commission grid based on product type
    grid_rec := NULL;
    
    IF LOWER(policy_rec.product_category) = 'life' THEN
      -- Check life_payout_grid
      SELECT 
        lpg.id as grid_id,
        'life_payout_grid' as grid_table,
        lpg.commission_rate,
        COALESCE(lpg.reward_rate, 0) as reward_rate,
        COALESCE(lpg.bonus_commission_rate, 0) as bonus_rate
      INTO grid_rec
      FROM life_payout_grid lpg
      LEFT JOIN life_policy_details lpd ON lpd.policy_id = policy_rec.id
      WHERE lpg.org_id = p_org_id
        AND LOWER(lpg.provider) = LOWER(policy_rec.provider)
        AND LOWER(lpg.product_type) = LOWER(policy_rec.product_category)
        AND (lpg.min_premium IS NULL OR premium >= lpg.min_premium)
        AND (lpg.max_premium IS NULL OR premium <= lpg.max_premium)
        AND lpg.is_active = true
        AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
      ORDER BY lpg.created_at DESC
      LIMIT 1;
      
    ELSIF LOWER(policy_rec.product_category) = 'health' THEN
      -- Check health_payout_grid
      SELECT 
        hpg.id as grid_id,
        'health_payout_grid' as grid_table,
        hpg.commission_rate,
        COALESCE(hpg.reward_rate, 0) as reward_rate,
        COALESCE(hpg.bonus_commission_rate, 0) as bonus_rate
      INTO grid_rec
      FROM health_payout_grid hpg
      LEFT JOIN health_policy_details hpd ON hpd.policy_id = policy_rec.id
      WHERE hpg.org_id = p_org_id
        AND LOWER(hpg.provider) = LOWER(policy_rec.provider)
        AND LOWER(hpg.product_type) = LOWER(policy_rec.product_category)
        AND (hpg.min_premium IS NULL OR premium >= hpg.min_premium)
        AND (hpg.max_premium IS NULL OR premium <= hpg.max_premium)
        AND hpg.is_active = true
        AND CURRENT_DATE BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, CURRENT_DATE)
      ORDER BY hpg.created_at DESC
      LIMIT 1;
      
    ELSIF LOWER(policy_rec.product_category) = 'motor' THEN
      -- Check motor_payout_grid
      SELECT 
        mpg.id as grid_id,
        'motor_payout_grid' as grid_table,
        mpg.commission_rate,
        COALESCE(mpg.reward_rate, 0) as reward_rate,
        COALESCE(mpg.bonus_commission_rate, 0) as bonus_rate
      INTO grid_rec
      FROM motor_payout_grid mpg
      LEFT JOIN motor_policy_details mpd ON mpd.policy_id = policy_rec.id
      WHERE mpg.org_id = p_org_id
        AND LOWER(mpg.provider) = LOWER(policy_rec.provider)
        AND LOWER(mpg.product_type) = LOWER(policy_rec.product_category)
        AND (mpg.min_premium IS NULL OR premium >= mpg.min_premium)
        AND (mpg.max_premium IS NULL OR premium <= mpg.max_premium)
        AND mpg.is_active = true
        AND CURRENT_DATE BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, CURRENT_DATE)
      ORDER BY mpg.created_at DESC
      LIMIT 1;
    END IF;
    
    -- If grid found, calculate commissions
    IF grid_rec IS NOT NULL THEN
      calculated_base_rate := grid_rec.commission_rate;
      calculated_reward_rate := grid_rec.reward_rate;
      calculated_bonus_rate := grid_rec.bonus_rate;
      calculated_total_rate := calculated_base_rate + calculated_reward_rate + calculated_bonus_rate;
      
      -- Calculate base insurer commission
      calculated_insurer_commission := premium * calculated_total_rate / 100;
      
      -- Distribute based on source type
      IF policy_rec.source_type = 'agent' AND policy_rec.agent_id IS NOT NULL THEN
        agent_percentage := COALESCE(policy_rec.agent_percentage, 50);
        calculated_agent_commission := calculated_insurer_commission * agent_percentage / 100;
        calculated_broker_share := calculated_insurer_commission - calculated_agent_commission;
        
      ELSIF policy_rec.source_type = 'misp' AND policy_rec.misp_id IS NOT NULL THEN
        misp_percentage := COALESCE(policy_rec.misp_percentage, 50);
        calculated_misp_commission := calculated_insurer_commission * misp_percentage / 100;
        calculated_broker_share := calculated_insurer_commission - calculated_misp_commission;
        
      ELSIF policy_rec.source_type = 'employee' AND policy_rec.employee_id IS NOT NULL THEN
        calculated_employee_commission := calculated_insurer_commission * employee_share_percentage / 100;
        calculated_broker_share := calculated_insurer_commission - calculated_employee_commission;
        
      ELSE
        -- Direct policy - all to broker
        calculated_broker_share := calculated_insurer_commission;
      END IF;
    END IF;
    
    -- Return the record
    RETURN QUERY SELECT
      policy_rec.id,
      policy_rec.policy_number,
      policy_rec.customer_name,
      policy_rec.product_category,
      policy_rec.product_name,
      policy_rec.plan_name,
      policy_rec.provider,
      premium,
      COALESCE(policy_rec.source_type, 'direct'),
      policy_rec.employee_id,
      policy_rec.employee_name,
      policy_rec.employee_code,
      policy_rec.agent_id,
      policy_rec.agent_name,
      policy_rec.agent_code,
      policy_rec.misp_id,
      policy_rec.misp_name,
      policy_rec.misp_name,
      COALESCE(grid_rec.grid_table, ''),
      grid_rec.grid_id,
      calculated_base_rate,
      calculated_reward_rate,
      calculated_bonus_rate,
      calculated_total_rate,
      calculated_insurer_commission,
      calculated_agent_commission,
      calculated_misp_commission,
      calculated_employee_commission,
      calculated_reporting_employee_commission,
      calculated_broker_share,
      'calculated'::text,
      COALESCE(policy_rec.created_at, NOW()),
      policy_rec.start_date;
  END LOOP;
END;
$$;

-- Create the sync function for comprehensive commissions
CREATE OR REPLACE FUNCTION sync_comprehensive_commissions_updated(p_org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Insert/update commission records using enhanced calculation
  FOR commission_rec IN 
    SELECT * FROM calculate_enhanced_comprehensive_commission_report(p_org_id)
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
      commission_rec.base_commission_rate,
      commission_rec.reward_commission_rate,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission * commission_rec.reward_commission_rate / 100,
      commission_rec.insurer_commission,
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
$$;