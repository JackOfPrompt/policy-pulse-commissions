-- Drop existing function and recreate with improved logic

DROP FUNCTION IF EXISTS calculate_enhanced_comprehensive_commission_report(uuid, uuid);

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
  target_org_id uuid;
BEGIN
  -- Determine target org_id
  target_org_id := COALESCE(p_org_id, (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1
  ));

  -- Get organization configuration
  SELECT * INTO org_config_rec FROM org_config WHERE org_id = target_org_id;

  -- Loop through policies with DISTINCT to prevent duplicates
  FOR policy_rec IN 
    SELECT DISTINCT ON (p.id) -- Ensure no duplicate policy processing
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
      COALESCE(
        NULLIF(TRIM(c.first_name || ' ' || COALESCE(c.last_name, '')), ''),
        c.first_name, 
        c.company_name,
        'Unknown Customer'
      ) as customer_name
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE p.org_id = target_org_id
      AND (p_policy_id IS NULL OR p.id = p_policy_id)
      AND p.policy_status = 'active'
      AND COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) > 0
    ORDER BY p.id, p.policy_number
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

    -- Find commission grid with improved matching logic
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
        AND LOWER(lpg.product_type) = 'life'
        AND (
          -- Match by provider_id if both are present
          (lpg.provider_id IS NOT NULL AND policy_rec.provider IS NOT NULL AND 
           EXISTS(SELECT 1 FROM providers pr WHERE pr.id = lpg.provider_id AND (
             LOWER(pr.name) = LOWER(policy_rec.provider) OR 
             LOWER(pr.code) = LOWER(policy_rec.provider)
           )))
          OR 
          -- Fallback to text matching
          (LOWER(TRIM(lpg.provider)) = LOWER(TRIM(COALESCE(policy_rec.provider, ''))))
        )
        AND (lpg.plan_name IS NULL OR 
             LOWER(TRIM(lpg.plan_name)) = LOWER(TRIM(COALESCE(policy_rec.plan_name, ''))) OR
             policy_rec.plan_name ILIKE '%' || lpg.plan_name || '%')
        AND (lpg.min_premium IS NULL OR premium >= lpg.min_premium)
        AND (lpg.max_premium IS NULL OR premium <= lpg.max_premium)
        AND lpg.is_active = true
        AND CURRENT_DATE BETWEEN COALESCE(lpg.commission_start_date, lpg.grid_effective_from) 
                             AND COALESCE(lpg.commission_end_date, lpg.grid_effective_to, CURRENT_DATE)
      ORDER BY 
        -- Prioritize exact plan name matches
        CASE WHEN lpg.plan_name IS NOT NULL AND LOWER(TRIM(lpg.plan_name)) = LOWER(TRIM(COALESCE(policy_rec.plan_name, ''))) THEN 1 ELSE 2 END,
        -- Prioritize provider_id matches over text matches
        CASE WHEN lpg.provider_id IS NOT NULL THEN 1 ELSE 2 END,
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
        AND LOWER(hpg.product_type) = 'health'
        AND (
          (hpg.provider_id IS NOT NULL AND policy_rec.provider IS NOT NULL AND 
           EXISTS(SELECT 1 FROM providers pr WHERE pr.id = hpg.provider_id AND (
             LOWER(pr.name) = LOWER(policy_rec.provider) OR 
             LOWER(pr.code) = LOWER(policy_rec.provider)
           )))
          OR 
          (LOWER(TRIM(hpg.provider)) = LOWER(TRIM(COALESCE(policy_rec.provider, ''))))
        )
        AND (hpg.min_premium IS NULL OR premium >= hpg.min_premium)
        AND (hpg.max_premium IS NULL OR premium <= hpg.max_premium)
        AND hpg.is_active = true
        AND CURRENT_DATE BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, CURRENT_DATE)
      ORDER BY 
        CASE WHEN hpg.provider_id IS NOT NULL THEN 1 ELSE 2 END,
        hpg.created_at DESC
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
        AND LOWER(mpg.product_type) = 'motor'
        AND (
          (mpg.provider_id IS NOT NULL AND policy_rec.provider IS NOT NULL AND 
           EXISTS(SELECT 1 FROM providers pr WHERE pr.id = mpg.provider_id AND (
             LOWER(pr.name) = LOWER(policy_rec.provider) OR 
             LOWER(pr.code) = LOWER(policy_rec.provider)
           )))
          OR 
          (LOWER(TRIM(mpg.provider)) = LOWER(TRIM(COALESCE(policy_rec.provider, ''))))
        )
        AND (mpg.min_premium IS NULL OR premium >= mpg.min_premium)
        AND (mpg.max_premium IS NULL OR premium <= mpg.max_premium)
        AND mpg.is_active = true
        AND CURRENT_DATE BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, CURRENT_DATE)
      ORDER BY 
        CASE WHEN mpg.provider_id IS NOT NULL THEN 1 ELSE 2 END,
        mpg.created_at DESC
      LIMIT 1;
    END IF;

    -- Calculate commissions if grid found
    IF grid_rec.id IS NOT NULL THEN
      base_rate := grid_rec.commission_rate;
      reward_rate := grid_rec.reward_rate;
      bonus_rate := grid_rec.bonus_rate;
      total_rate := base_rate + reward_rate + bonus_rate;
      
      -- Calculate base insurer commission
      insurer_comm := premium * total_rate / 100;
      
      -- Distribute commission based on source type
      IF policy_rec.source_type = 'external' AND policy_rec.agent_id IS NOT NULL THEN
        SELECT a.*, ct.name as tier_name, 
               COALESCE(a.override_percentage, a.base_percentage, ct.base_percentage, 0) as effective_percentage
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
          IF agent_rec.reporting_manager_id IS NOT NULL THEN
            SELECT e.* INTO employee_rec FROM employees e WHERE e.id = agent_rec.reporting_manager_id;
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
          
          -- Check if MISP reports to an employee
          IF misp_rec.reporting_manager_id IS NOT NULL THEN
            SELECT e.* INTO employee_rec FROM employees e WHERE e.id = misp_rec.reporting_manager_id;
            IF employee_rec.id IS NOT NULL THEN
              reporting_emp_comm := broker_comm * COALESCE(org_config_rec.employee_share_percentage, 60) / 100;
              broker_comm := broker_comm - reporting_emp_comm;
            END IF;
          END IF;
        END IF;
        
      ELSIF policy_rec.source_type = 'internal' AND policy_rec.employee_id IS NOT NULL THEN
        SELECT * INTO employee_rec FROM employees WHERE id = policy_rec.employee_id;
        IF employee_rec.id IS NOT NULL THEN
          employee_comm := insurer_comm * COALESCE(org_config_rec.employee_share_percentage, 60) / 100;
          broker_comm := insurer_comm - employee_comm;
        END IF;
        
      ELSE
        -- Direct sale - all commission goes to broker
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

-- Update the sync function to use updated comprehensive commissions
CREATE OR REPLACE FUNCTION sync_comprehensive_commissions_updated(p_org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  commission_rec RECORD;
  target_org_id uuid;
BEGIN
  -- Get current user's org if not provided
  target_org_id := COALESCE(p_org_id, (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1
  ));

  -- Insert/update commission records using enhanced calculation
  FOR commission_rec IN 
    SELECT * FROM calculate_enhanced_comprehensive_commission_report(target_org_id)
  LOOP
    -- Update policy_commissions table
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
      target_org_id,
      commission_rec.product_category,
      commission_rec.grid_table,
      commission_rec.grid_id,
      commission_rec.total_commission_rate,
      commission_rec.reward_commission_rate,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission * commission_rec.reward_commission_rate / NULLIF(commission_rec.total_commission_rate, 0),
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

    -- Insert agent commission history if applicable
    IF commission_rec.agent_commission > 0 AND commission_rec.agent_id IS NOT NULL THEN
      INSERT INTO agent_commission_history (
        org_id,
        agent_id,
        policy_id,
        applied_grid_table,
        applied_grid_id,
        base_commission_rate,
        reward_commission_rate,
        bonus_commission_rate,
        total_commission_rate,
        commission_percentage,
        commission_amount,
        is_reporting_employee_applied
      )
      VALUES (
        target_org_id,
        commission_rec.agent_id,
        commission_rec.policy_id,
        commission_rec.grid_table,
        commission_rec.grid_id,
        commission_rec.base_commission_rate,
        commission_rec.reward_commission_rate,
        commission_rec.bonus_commission_rate,
        commission_rec.total_commission_rate,
        commission_rec.agent_tier_percentage,
        commission_rec.agent_commission,
        commission_rec.reporting_employee_commission > 0
      )
      ON CONFLICT (policy_id) DO UPDATE SET
        commission_amount = EXCLUDED.commission_amount,
        commission_percentage = EXCLUDED.commission_percentage,
        is_reporting_employee_applied = EXCLUDED.is_reporting_employee_applied,
        updated_at = NOW();
    END IF;

    -- Insert employee commission history if applicable
    IF (commission_rec.employee_commission > 0 OR commission_rec.reporting_employee_commission > 0) AND 
       (commission_rec.employee_id IS NOT NULL) THEN
      INSERT INTO employee_commission_history (
        org_id,
        employee_id,
        policy_id,
        applied_grid_table,
        applied_grid_id,
        base_commission_rate,
        reward_commission_rate,
        bonus_commission_rate,
        total_commission_rate,
        commission_amount,
        is_reporting_employee
      )
      VALUES (
        target_org_id,
        commission_rec.employee_id,
        commission_rec.policy_id,
        commission_rec.grid_table,
        commission_rec.grid_id,
        commission_rec.base_commission_rate,
        commission_rec.reward_commission_rate,
        commission_rec.bonus_commission_rate,
        commission_rec.total_commission_rate,
        GREATEST(commission_rec.employee_commission, commission_rec.reporting_employee_commission),
        commission_rec.reporting_employee_commission > 0
      )
      ON CONFLICT (policy_id, employee_id) DO UPDATE SET
        commission_amount = EXCLUDED.commission_amount,
        is_reporting_employee = EXCLUDED.is_reporting_employee,
        updated_at = NOW();
    END IF;
  END LOOP;
END;
$$;