-- Update all database function names to use standardized naming conventions

-- Update comprehensive commission calculation function
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_commission_report_normalized(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(policy_id uuid, policy_number text, product_category text, product_name text, plan_name text, provider text, source_type text, grid_table text, grid_id uuid, commission_rate numeric, reward_rate numeric, total_commission_rate numeric, insurer_commission numeric, agent_commission numeric, misp_commission numeric, employee_commission numeric, broker_share numeric, calc_date timestamp with time zone)
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
  (g.commission_rate + g.reward_rate) AS total_commission_rate,
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

-- Update sync commission function to use standardized naming
CREATE OR REPLACE FUNCTION public.sync_comprehensive_commissions_standardized(p_org_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Insert/update commission records using normalized calculation
  FOR commission_rec IN 
    SELECT * FROM calculate_comprehensive_commission_report_normalized(p_org_id)
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
      commission_rec.commission_rate,
      commission_rec.reward_rate,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission * commission_rec.reward_rate / 100,
      commission_rec.insurer_commission + (commission_rec.insurer_commission * commission_rec.reward_rate / 100),
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
      reward_amount = EXCLUDED.reward_amount,
      total_amount = EXCLUDED.total_amount,
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
$function$;

-- Update commission calculation trigger to use standardized naming
CREATE OR REPLACE FUNCTION public.auto_calculate_commission_standardized()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only calculate for active policies with premium
  IF NEW.policy_status = 'active' AND COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) > 0 THEN
    -- Use the comprehensive commission calculation
    PERFORM sync_comprehensive_commissions_standardized(NEW.org_id);
  END IF;

  RETURN NEW;
END;
$function$;

-- Update policy commission validation trigger
CREATE OR REPLACE FUNCTION public.validate_policy_source_assignment_standardized()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If source_type is set, ensure the corresponding ID is also set
  IF NEW.source_type = 'employee' AND NEW.employee_id IS NULL THEN
    RAISE EXCEPTION 'employee_id must not be null when source_type is employee';
  END IF;
  
  IF NEW.source_type = 'agent' AND NEW.agent_id IS NULL THEN
    RAISE EXCEPTION 'agent_id must not be null when source_type is agent';
  END IF;
  
  IF NEW.source_type = 'misp' AND NEW.misp_id IS NULL THEN
    RAISE EXCEPTION 'misp_id must not be null when source_type is misp';
  END IF;
  
  -- Ensure only one source ID is set based on source_type
  IF NEW.source_type = 'employee' THEN
    NEW.agent_id := NULL;
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'agent' THEN
    NEW.employee_id := NULL;
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'misp' THEN
    NEW.employee_id := NULL;
    NEW.agent_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update user management trigger to use standardized naming
CREATE OR REPLACE FUNCTION public.sync_user_profile_standardized()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the profile role to match the primary organization role
  UPDATE public.profiles 
  SET role = NEW.role,
      primary_org_id = NEW.org_id,
      updated_at = NOW()
  WHERE id = NEW.user_id 
    AND (primary_org_id = NEW.org_id OR primary_org_id IS NULL);
  
  RETURN NEW;
END;
$function$;

-- Replace existing triggers with standardized versions
DROP TRIGGER IF EXISTS auto_calculate_commission_splits ON policies;
DROP TRIGGER IF EXISTS validate_policy_source_assignment ON policies;
DROP TRIGGER IF EXISTS sync_profile_role ON user_organizations;

-- Create standardized triggers
CREATE TRIGGER auto_calculate_commission_standardized
  AFTER INSERT OR UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_commission_standardized();

CREATE TRIGGER validate_policy_source_assignment_standardized
  BEFORE INSERT OR UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION validate_policy_source_assignment_standardized();

CREATE TRIGGER sync_user_profile_standardized
  AFTER INSERT OR UPDATE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_standardized();

-- Add comprehensive commission view with standardized naming
CREATE OR REPLACE VIEW policy_commission_standardized_view AS
SELECT 
  p.id as policy_id,
  p.policy_number,
  pt.name as product_type,
  CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
  COALESCE(p.premium_with_gst, p.premium_without_gst, 0) as premium_amount,
  p.provider,
  p.source_type,
  CASE 
    WHEN p.source_type = 'agent' THEN COALESCE((SELECT agent_name FROM agents WHERE id = p.agent_id), 'Unknown Agent')
    WHEN p.source_type = 'misp' THEN COALESCE((SELECT channel_partner_name FROM misps WHERE id = p.misp_id), 'Unknown MISP')
    WHEN p.source_type = 'employee' THEN COALESCE((SELECT name FROM employees WHERE id = p.employee_id), 'Unknown Employee')
    ELSE 'Direct'
  END as source_name,
  pc.commission_rate as commission_rate,
  pc.insurer_commission as insurer_commission_amount,
  pc.agent_commission as agent_commission_amount,
  pc.misp_commission as misp_commission_amount,
  pc.employee_commission as employee_commission_amount,
  pc.broker_share as broker_share_amount,
  pc.commission_status,
  pc.grid_table as grid_source,
  pc.calc_date,
  p.org_id
FROM policies p
LEFT JOIN product_types pt ON pt.id = p.product_type_id
LEFT JOIN customers c ON c.id = p.customer_id
LEFT JOIN policy_commissions pc ON pc.policy_id = p.id AND pc.is_active = true
WHERE p.policy_status = 'active';