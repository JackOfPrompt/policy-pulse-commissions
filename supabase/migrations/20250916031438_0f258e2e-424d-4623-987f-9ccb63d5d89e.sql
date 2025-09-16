-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.calculate_comprehensive_commission_report_normalized(uuid, uuid);
DROP FUNCTION IF EXISTS public.sync_comprehensive_commissions_updated(uuid);

-- Create the standardized comprehensive commission calculation function
CREATE OR REPLACE FUNCTION public.calculate_comprehensive_commission_report_normalized(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
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
   total_commission_rate numeric,
   insurer_commission numeric, 
   agent_commission numeric, 
   misp_commission numeric, 
   employee_commission numeric, 
   broker_share numeric, 
   calc_date timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cr.policy_id,
    cr.policy_number,
    cr.product_category,
    cr.product_name,
    cr.plan_name,
    cr.provider,
    cr.source_type,
    cr.grid_table,
    cr.grid_id,
    cr.commission_rate,
    cr.reward_rate,
    (cr.commission_rate + COALESCE(cr.reward_rate, 0)) as total_commission_rate,
    cr.insurer_commission,
    cr.agent_commission,
    cr.misp_commission,
    cr.employee_commission,
    cr.broker_share,
    cr.calc_date
  FROM calculate_comprehensive_commission_report(p_org_id, p_policy_id) cr;
END;
$function$;

-- Create the standardized sync function
CREATE OR REPLACE FUNCTION public.sync_comprehensive_commissions_updated(p_org_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  commission_rec RECORD;
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

  -- Insert/update commission records using normalized calculation
  FOR commission_rec IN 
    SELECT * FROM calculate_comprehensive_commission_report_normalized(current_org_id)
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
      current_org_id,
      commission_rec.product_category,
      commission_rec.grid_table,
      commission_rec.grid_id,
      commission_rec.commission_rate,
      commission_rec.reward_rate,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission * COALESCE(commission_rec.reward_rate, 0) / 100,
      commission_rec.insurer_commission * (100 + COALESCE(commission_rec.reward_rate, 0)) / 100,
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