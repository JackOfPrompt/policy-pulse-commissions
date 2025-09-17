-- Fix commission calculation function to prevent duplicates and improve grid matching

CREATE OR REPLACE FUNCTION calculate_enhanced_comprehensive_commission_report(
  p_org_id uuid DEFAULT NULL,
  p_policy_id uuid DEFAULT NULL
)
RETURNS TABLE(
  policy_id uuid,
  policy_number text,
  premium_amount numeric,
  product_category text,
  product_name text,
  plan_name text,
  provider text,
  source_type text,
  employee_id uuid,
  employee_code text,
  employee_name text,
  agent_id uuid,
  agent_code text,
  agent_name text,
  misp_id uuid,
  misp_name text,
  customer_name text,
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
  agent_tier_percentage numeric,
  tier_name text,
  calc_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  policy_rec RECORD;
  grid_rec RECORD;
  org_config_rec RECORD;
  agent_rec RECORD;
  misp_rec RECORD;
  employee_rec RECORD;
  
  premium numeric := 0;
  sum_insured numeric := 0;
  
  base_rate numeric := 0;
  reward_rate numeric := 0;
  bonus_rate numeric := 0;
  total_rate numeric := 0;
  
  insurer_comm numeric := 0;
  agent_comm numeric := 0;
  misp_comm numeric := 0;
  employee_comm numeric := 0;
  reporting_emp_comm numeric := 0;
  broker_comm numeric := 0;
  
  agent_percentage numeric := 0;
  tier_name_text text := NULL;
BEGIN
  -- Get organization configuration
  SELECT * INTO org_config_rec FROM org_config WHERE org_id = COALESCE(p_org_id, (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1
  ));

  -- Loop through policies
  FOR policy_rec IN 
    SELECT DISTINCT -- Ensure no duplicates
      p.id,
      p.policy_number,
      p.provider,
      p.plan_name,
      p.source_type,
      p.employee_id,
      p.agent_id,
      p.misp_id,
      p.customer_id,
      p.org_id,
      COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) as premium,
      pt.category as product_category,
      pt.name as product_name,
      COALESCE(c.first_name || ' ' || c.last_name, c.first_name, c.company_name) as customer_name
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE p.org_id = COALESCE(p_org_id, (SELECT org_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1))
      AND (p_policy_id IS NULL OR p.id = p_policy_id)
      AND p.policy_status = 'active'
    ORDER BY p.policy_number
  LOOP
    -- Reset values for each policy
    base_rate := 0;
    reward_rate := 0;
    bonus_rate := 0;
    total_rate := 0;
    insurer_comm := 0;
    agent_comm := 0;
    misp_comm := 0;
    employee_comm := 0;
    reporting_emp_comm := 0;
    broker_comm := 0;
    agent_percentage := 0;
    tier_name_text := NULL;
    grid_rec := NULL;
    agent_rec := NULL;
    misp_rec := NULL;
    employee_rec := NULL;
    
    premium := policy_rec.premium;

    -- Find commission grid based on product type
    IF LOWER(policy_rec.product_category) = 'life' THEN
      SELECT 
        lpg.id,
        lpg.commission_rate,
        COALESCE(lpg.reward_rate, 0) as reward_rate,
        COALESCE(lpg.bonus_commission_rate, 0) as bonus_rate,
        'life_payout_grid' as table_name
      INTO grid_rec
      FROM life_payout_grid lpg
      WHERE lpg.org_id = policy_rec.org_id
        AND LOWER(lpg.product_type) = LOWER(policy_rec.product_category)
        AND (
          (lpg.provider_id IS NOT NULL AND policy_rec.provider IS NOT NULL AND 
           EXISTS(SELECT 1 FROM providers pr WHERE pr.id = lpg.provider_id AND LOWER(pr.name) = LOWER(policy_rec.provider)))
          OR 
          (LOWER(lpg.provider) = LOWER(COALESCE(policy_rec.provider, '')))
        )
        AND (lpg.plan_name IS NULL OR LOWER(lpg.plan_name) = LOWER(COALESCE(policy_rec.plan_name, '')))
        AND (lpg.min_premium IS NULL OR premium >= lpg.min_premium)
        AND (lpg.max_premium IS NULL OR premium <= lpg.max_premium)
        AND lpg.is_active = true
        AND CURRENT_DATE BETWEEN lpg.effective_from AND COALESCE(lpg.effective_to, CURRENT_DATE)
      ORDER BY 
        CASE WHEN lpg.plan_name IS NOT NULL AND LOWER(lpg.plan_name) = LOWER(COALESCE(policy_rec.plan_name, '')) THEN 1 ELSE 2 END,
        lpg.created_at DESC
      LIMIT 1;
      
    ELSIF LOWER(policy_rec.product_category) = 'health' THEN
      SELECT 
        hpg.id,
        hpg.commission_rate,
        COALESCE(hpg.reward_rate, 0) as reward_rate,
        COALESCE(hpg.bonus_commission_rate, 0) as bonus_rate,
        'health_payout_grid' as table_name
      INTO grid_rec
      FROM health_payout_grid hpg
      WHERE hpg.org_id = policy_rec.org_id
        AND LOWER(hpg.product_type) = LOWER(policy_rec.product_category)
        AND (
          (hpg.provider_id IS NOT NULL AND policy_rec.provider IS NOT NULL AND 
           EXISTS(SELECT 1 FROM providers pr WHERE pr.id = hpg.provider_id AND LOWER(pr.name) = LOWER(policy_rec.provider)))
          OR 
          (LOWER(hpg.provider) = LOWER(COALESCE(policy_rec.provider, '')))
        )
        AND (hpg.min_premium IS NULL OR premium >= hpg.min_premium)
        AND (hpg.max_premium IS NULL OR premium <= hpg.max_premium)
        AND hpg.is_active = true
        AND CURRENT_DATE BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, CURRENT_DATE)
      ORDER BY hpg.created_at DESC
      LIMIT 1;
      
    ELSIF LOWER(policy_rec.product_category) = 'motor' THEN
      SELECT 
        mpg.id,
        mpg.commission_rate,
        COALESCE(mpg.reward_rate, 0) as reward_rate,
        COALESCE(mpg.bonus_commission_rate, 0) as bonus_rate,
        'motor_payout_grid' as table_name
      INTO grid_rec
      FROM motor_payout_grid mpg
      WHERE mpg.org_id = policy_rec.org_id
        AND LOWER(mpg.product_type) = LOWER(policy_rec.product_category)
        AND (
          (mpg.provider_id IS NOT NULL AND policy_rec.provider IS NOT NULL AND 
           EXISTS(SELECT 1 FROM providers pr WHERE pr.id = mpg.provider_id AND LOWER(pr.name) = LOWER(policy_rec.provider)))
          OR 
          (LOWER(mpg.provider) = LOWER(COALESCE(policy_rec.provider, '')))
        )
        AND (mpg.min_premium IS NULL OR premium >= mpg.min_premium)
        AND (mpg.max_premium IS NULL OR premium <= mpg.max_premium)
        AND mpg.is_active = true
        AND CURRENT_DATE BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, CURRENT_DATE)
      ORDER BY mpg.created_at DESC
      LIMIT 1;
    END IF;

    -- If grid found, calculate commissions
    IF grid_rec.id IS NOT NULL THEN
      base_rate := grid_rec.commission_rate;
      reward_rate := grid_rec.reward_rate;
      bonus_rate := grid_rec.bonus_rate;
      total_rate := base_rate + reward_rate + bonus_rate;
      
      -- Calculate base insurer commission
      insurer_comm := premium * total_rate / 100;
      
      -- Get source details and calculate distribution
      IF policy_rec.source_type = 'external' AND policy_rec.agent_id IS NOT NULL THEN
        SELECT a.*, ct.name as tier_name, 
               COALESCE(a.override_percentage, a.base_percentage, ct.base_percentage) as effective_percentage
        INTO agent_rec
        FROM agents a
        LEFT JOIN commission_tiers ct ON ct.id = a.commission_tier_id
        WHERE a.id = policy_rec.agent_id;
        
        IF agent_rec.id IS NOT NULL THEN
          agent_percentage := COALESCE(agent_rec.effective_percentage, 0);
          tier_name_text := agent_rec.tier_name;
          agent_comm := insurer_comm * agent_percentage / 100;
          broker_comm := insurer_comm - agent_comm;
          
          -- Check if agent reports to an employee
          IF agent_rec.employee_id IS NOT NULL THEN
            SELECT e.* INTO employee_rec FROM employees e WHERE e.id = agent_rec.employee_id;
            IF employee_rec.id IS NOT NULL THEN
              reporting_emp_comm := broker_comm * COALESCE(org_config_rec.employee_share_percentage, 60) / 100;
              broker_comm := broker_comm - reporting_emp_comm;
            END IF;
          END IF;
        END IF;
        
      ELSIF policy_rec.source_type = 'external' AND policy_rec.misp_id IS NOT NULL THEN
        SELECT * INTO misp_rec FROM misps WHERE id = policy_rec.misp_id;
        IF misp_rec.id IS NOT NULL THEN
          misp_comm := insurer_comm * COALESCE(misp_rec.percentage, 50) / 100;
          broker_comm := insurer_comm - misp_comm;
        END IF;
        
      ELSIF policy_rec.source_type = 'internal' AND policy_rec.employee_id IS NOT NULL THEN
        SELECT * INTO employee_rec FROM employees WHERE id = policy_rec.employee_id;
        IF employee_rec.id IS NOT NULL THEN
          employee_comm := insurer_comm * COALESCE(org_config_rec.employee_share_percentage, 60) / 100;
          broker_comm := insurer_comm - employee_comm;
        END IF;
        
      ELSE
        -- Direct sale - all to broker
        broker_comm := insurer_comm;
      END IF;
    END IF;

    -- Return the calculated commission data
    RETURN QUERY SELECT 
      policy_rec.id,
      policy_rec.policy_number,
      premium,
      policy_rec.product_category,
      policy_rec.product_name,
      policy_rec.plan_name,
      policy_rec.provider,
      policy_rec.source_type,
      policy_rec.employee_id,
      employee_rec.employee_code,
      employee_rec.name,
      policy_rec.agent_id,
      agent_rec.agent_code,
      agent_rec.agent_name,
      policy_rec.misp_id,
      misp_rec.channel_partner_name,
      policy_rec.customer_name,
      COALESCE(grid_rec.table_name, ''),
      grid_rec.id,
      base_rate,
      reward_rate,
      bonus_rate,
      total_rate,
      insurer_comm,
      agent_comm,
      misp_comm,
      employee_comm,
      reporting_emp_comm,
      broker_comm,
      agent_percentage,
      tier_name_text,
      NOW();
  END LOOP;
END;
$$;