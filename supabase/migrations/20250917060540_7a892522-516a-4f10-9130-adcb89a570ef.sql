-- Fix misp_rec assignment issue in calculate_enhanced_comprehensive_commission_report function
CREATE OR REPLACE FUNCTION public.calculate_enhanced_comprehensive_commission_report(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  policy_id uuid, policy_number text, product_category text, product_name text, plan_name text, provider text, source_type text,
  employee_id uuid, agent_id uuid, misp_id uuid, employee_name text, agent_name text, misp_name text,
  customer_id uuid, customer_name text, org_id uuid, premium_amount numeric, sum_insured numeric,
  base_commission_rate numeric, reward_commission_rate numeric, bonus_commission_rate numeric, total_commission_rate numeric,
  insurer_commission numeric, agent_commission numeric, misp_commission numeric, employee_commission numeric,
  reporting_employee_id uuid, reporting_employee_name text, reporting_employee_commission numeric, broker_share numeric,
  grid_table text, grid_id uuid, calc_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  policy_rec record;
  org_config_rec record;
  agent_rec record;
  misp_rec record;
  employee_rec record;
  reporting_emp_rec record;
  
  premium numeric := 0;
  sum_insured numeric := 0;
  grid_commission_rate numeric := 0;
  grid_reward_rate numeric := 0;
  grid_bonus_rate numeric := 0;
  grid_found boolean := false;
  
  base_commission_amount numeric := 0;
  calculated_agent_commission numeric := 0;
  calculated_misp_commission numeric := 0;
  calculated_employee_commission numeric := 0;
  calculated_reporting_employee_commission numeric := 0;
  calculated_broker_share numeric := 0;
  
  status text := 'calculated';
  grid_source_name text := '';
  grid_uuid uuid := NULL;
  v_match_date date;
BEGIN
  -- Get current user's org if not provided
  IF p_org_id IS NULL THEN
    SELECT org_id INTO p_org_id
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    LIMIT 1;
  END IF;
  
  -- Loop through policies
  FOR policy_rec IN 
    SELECT 
      p.id, p.policy_number, p.provider, p.source_type, p.employee_id, p.agent_id, p.misp_id,
      p.org_id, p.plan_name, p.provider_id, p.issue_date, p.start_date,
      COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) as premium_amount,
      COALESCE((p.dynamic_details->>'sum_insured')::numeric, 0) as sum_insured,
      pt.name as product_name, pt.category as product_category,
      c.id as customer_id,
      CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_full_name
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE p.policy_status = 'active'
      AND (p_org_id IS NULL OR p.org_id = p_org_id)
      AND (p_policy_id IS NULL OR p.id = p_policy_id)
  LOOP
    -- Initialize all variables for each policy
    premium := policy_rec.premium_amount;
    sum_insured := policy_rec.sum_insured;
    grid_commission_rate := 0;
    grid_reward_rate := 0;
    grid_bonus_rate := 0;
    grid_found := false;
    
    base_commission_amount := 0;
    calculated_agent_commission := 0;
    calculated_misp_commission := 0;
    calculated_employee_commission := 0;
    calculated_reporting_employee_commission := 0;
    calculated_broker_share := 0;
    
    grid_source_name := '';
    grid_uuid := NULL;
    v_match_date := COALESCE(policy_rec.issue_date, policy_rec.start_date, CURRENT_DATE);
    
    -- Initialize record variables to avoid "not assigned" errors
    agent_rec := NULL;
    misp_rec := NULL;
    employee_rec := NULL;
    reporting_emp_rec := NULL;
    
    -- Get org config
    SELECT * INTO org_config_rec FROM org_config WHERE org_id = policy_rec.org_id;
    
    -- Get source records based on policy source type
    IF policy_rec.source_type = 'external' AND policy_rec.agent_id IS NOT NULL THEN
      SELECT * INTO agent_rec FROM agents WHERE id = policy_rec.agent_id;
    END IF;
    
    IF policy_rec.source_type = 'external' AND policy_rec.misp_id IS NOT NULL THEN
      SELECT * INTO misp_rec FROM misps WHERE id = policy_rec.misp_id;
    END IF;
    
    IF policy_rec.source_type = 'internal' AND policy_rec.employee_id IS NOT NULL THEN
      SELECT * INTO employee_rec FROM employees WHERE id = policy_rec.employee_id;
    END IF;
    
    -- Find matching commission grid based on product type
    IF LOWER(policy_rec.product_category) = 'life' THEN
      SELECT lpg.id, lpg.commission_rate, COALESCE(lpg.reward_rate,0), COALESCE(lpg.bonus_commission_rate,0)
      INTO grid_uuid, grid_commission_rate, grid_reward_rate, grid_bonus_rate
      FROM life_payout_grid lpg
      LEFT JOIN life_policy_details lpd ON lpd.policy_id = policy_rec.id
      WHERE lpg.org_id = policy_rec.org_id
        AND lpg.product_type = policy_rec.product_category
        AND (
              (lpg.provider_id IS NOT NULL AND policy_rec.provider_id IS NOT NULL AND lpg.provider_id = policy_rec.provider_id)
           OR (lpg.provider_id IS NULL AND policy_rec.provider_id IS NULL AND lower(lpg.provider) = lower(COALESCE(policy_rec.provider,'')))
            )
        AND (lpg.product_sub_type IS NULL OR lpg.product_sub_type = COALESCE(lpd.plan_type,''))
        AND (lpg.plan_name IS NULL OR lpg.plan_name = policy_rec.plan_name)
        AND (lpg.ppt IS NULL OR lpg.ppt = COALESCE(lpd.premium_payment_term, 0))
        AND (lpg.pt IS NULL OR lpg.pt = COALESCE(lpd.policy_term, 0))
        AND (
          (lpg.min_premium IS NULL AND lpg.max_premium IS NULL)
          OR (premium BETWEEN COALESCE(lpg.min_premium, 0) AND COALESCE(lpg.max_premium, 999999999))
        )
        AND lpg.is_active = true
        AND v_match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, v_match_date)
      ORDER BY lpg.created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        grid_found := true;
        grid_source_name := 'life_payout_grid';
      END IF;
      
    ELSIF LOWER(policy_rec.product_category) = 'health' THEN
      SELECT hpg.id, hpg.commission_rate, COALESCE(hpg.reward_rate,0), COALESCE(hpg.bonus_commission_rate,0)
      INTO grid_uuid, grid_commission_rate, grid_reward_rate, grid_bonus_rate
      FROM health_payout_grid hpg
      LEFT JOIN health_policy_details hpd ON hpd.policy_id = policy_rec.id
      WHERE hpg.org_id = policy_rec.org_id
        AND hpg.product_type = policy_rec.product_category
        AND (
              (hpg.provider_id IS NOT NULL AND policy_rec.provider_id IS NOT NULL AND hpg.provider_id = policy_rec.provider_id)
           OR (hpg.provider_id IS NULL AND policy_rec.provider_id IS NULL AND lower(hpg.provider) = lower(COALESCE(policy_rec.provider,'')))
            )
        AND (hpg.product_sub_type IS NULL OR hpg.product_sub_type = COALESCE(hpd.cover_type,''))
        AND (hpg.plan_name IS NULL OR hpg.plan_name = policy_rec.plan_name)
        AND (hpg.age_group IS NULL OR hpg.age_group = 'all')
        AND (
          (hpg.min_premium IS NULL AND hpg.max_premium IS NULL)
          OR (premium BETWEEN COALESCE(hpg.min_premium, 0) AND COALESCE(hpg.max_premium, 999999999))
        )
        AND (
          (hpg.sum_insured_min IS NULL AND hpg.sum_insured_max IS NULL)
          OR (sum_insured BETWEEN COALESCE(hpg.sum_insured_min, 0) AND COALESCE(hpg.sum_insured_max, 999999999))
        )
        AND hpg.is_active = true
        AND v_match_date BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, v_match_date)
      ORDER BY hpg.created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        grid_found := true;
        grid_source_name := 'health_payout_grid';
      END IF;
      
    ELSIF LOWER(policy_rec.product_category) = 'motor' THEN
      SELECT mpg.id, mpg.commission_rate, COALESCE(mpg.reward_rate,0), COALESCE(mpg.bonus_commission_rate,0)
      INTO grid_uuid, grid_commission_rate, grid_reward_rate, grid_bonus_rate
      FROM motor_payout_grid mpg
      LEFT JOIN motor_policy_details mpd ON mpd.policy_id = policy_rec.id
      WHERE mpg.org_id = policy_rec.org_id
        AND mpg.product_type = policy_rec.product_category
        AND (
              (mpg.provider_id IS NOT NULL AND policy_rec.provider_id IS NOT NULL AND mpg.provider_id = policy_rec.provider_id)
           OR (mpg.provider_id IS NULL AND policy_rec.provider_id IS NULL AND lower(mpg.provider) = lower(COALESCE(policy_rec.provider,'')))
            )
        AND (mpg.product_subtype IS NULL OR mpg.product_subtype = COALESCE(mpd.policy_type,''))
        AND (
          (mpg.min_premium IS NULL AND mpg.max_premium IS NULL)
          OR (premium BETWEEN COALESCE(mpg.min_premium, 0) AND COALESCE(mpg.max_premium, 999999999))
        )
        AND mpg.is_active = true
        AND v_match_date BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, v_match_date)
      ORDER BY mpg.created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        grid_found := true;
        grid_source_name := 'motor_payout_grid';
      END IF;
    END IF;
    
    -- Calculate commissions if grid found
    IF grid_found THEN
      base_commission_amount := premium * grid_commission_rate / 100;
      
      -- Commission distribution based on source type
      IF policy_rec.source_type = 'internal' AND employee_rec IS NOT NULL THEN
        -- Employee gets base commission rate percentage
        calculated_employee_commission := premium * grid_commission_rate / 100;
        -- Broker gets reward + bonus rates
        calculated_broker_share := premium * (grid_reward_rate + grid_bonus_rate) / 100;
        
      ELSIF policy_rec.source_type = 'external' AND agent_rec IS NOT NULL THEN
        -- Agent commission based on tier percentage
        calculated_agent_commission := base_commission_amount * COALESCE(agent_rec.override_percentage, agent_rec.base_percentage, 50) / 100;
        calculated_broker_share := base_commission_amount - calculated_agent_commission;
        
        -- Handle reporting employee commission if agent has reporting manager
        IF agent_rec.reporting_manager_id IS NOT NULL THEN
          SELECT * INTO reporting_emp_rec FROM employees WHERE id = agent_rec.reporting_manager_id;
          IF reporting_emp_rec IS NOT NULL THEN
            calculated_reporting_employee_commission := calculated_agent_commission * 0.1; -- 10% to reporting employee
            calculated_agent_commission := calculated_agent_commission - calculated_reporting_employee_commission;
          END IF;
        END IF;
        
      ELSIF policy_rec.source_type = 'external' AND misp_rec IS NOT NULL THEN
        -- MISP commission based on percentage
        calculated_misp_commission := base_commission_amount * COALESCE(misp_rec.override_percentage, misp_rec.percentage, 50) / 100;
        calculated_broker_share := base_commission_amount - calculated_misp_commission;
        
        -- Handle reporting employee commission if MISP has reporting manager
        IF misp_rec.reporting_manager_id IS NOT NULL THEN
          SELECT * INTO reporting_emp_rec FROM employees WHERE id = misp_rec.reporting_manager_id;
          IF reporting_emp_rec IS NOT NULL THEN
            calculated_reporting_employee_commission := calculated_misp_commission * 0.1; -- 10% to reporting employee
            calculated_misp_commission := calculated_misp_commission - calculated_reporting_employee_commission;
          END IF;
        END IF;
        
      ELSE
        -- Direct org sale - all goes to broker
        calculated_broker_share := base_commission_amount;
      END IF;
    END IF;
    
    -- Return the row
    RETURN QUERY SELECT 
      policy_rec.id,
      policy_rec.policy_number,
      policy_rec.product_category,
      policy_rec.product_name,
      policy_rec.plan_name,
      policy_rec.provider,
      policy_rec.source_type,
      policy_rec.employee_id,
      policy_rec.agent_id,
      policy_rec.misp_id,
      COALESCE(employee_rec.name, ''),
      COALESCE(agent_rec.agent_name, ''),
      COALESCE(misp_rec.channel_partner_name, ''),
      policy_rec.customer_id,
      policy_rec.customer_full_name,
      policy_rec.org_id,
      premium,
      sum_insured,
      grid_commission_rate,
      grid_reward_rate,
      grid_bonus_rate,
      (grid_commission_rate + grid_reward_rate + grid_bonus_rate),
      base_commission_amount,
      calculated_agent_commission,
      calculated_misp_commission,
      calculated_employee_commission,
      COALESCE(reporting_emp_rec.id, NULL),
      COALESCE(reporting_emp_rec.name, ''),
      calculated_reporting_employee_commission,
      calculated_broker_share,
      grid_source_name,
      grid_uuid,
      NOW();
      
  END LOOP;
END;
$function$;