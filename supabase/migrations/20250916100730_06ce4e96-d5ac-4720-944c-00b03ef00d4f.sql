-- Create comprehensive revenue table sync function
CREATE OR REPLACE FUNCTION public.sync_revenue_table_comprehensive(p_org_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Clear existing data for the org (or all if no org specified)
  IF p_org_id IS NOT NULL THEN
    DELETE FROM revenue_table WHERE org_id = p_org_id;
  ELSE
    DELETE FROM revenue_table;
  END IF;

  -- Insert comprehensive commission data with proper policy and grid mapping
  INSERT INTO revenue_table (
    policy_id,
    policy_number,
    provider,
    product_type,
    source_type,
    employee_id,
    agent_id,
    misp_id,
    employee_name,
    agent_name,
    misp_name,
    reporting_employee_id,
    reporting_employee_name,
    customer_name,
    org_id,
    premium,
    base_rate,
    reward_rate,
    bonus_rate,
    total_rate,
    insurer_commission,
    agent_commission,
    employee_commission,
    reporting_employee_commission,
    broker_share,
    commission_status,
    calc_date
  )
  SELECT 
    cr.policy_id,
    cr.policy_number,
    cr.provider,
    cr.product_category as product_type,
    cr.source_type,
    COALESCE(
      (SELECT id FROM employees WHERE id = (SELECT employee_id FROM policies WHERE id = cr.policy_id)),
      (SELECT a.employee_id FROM agents a JOIN policies p ON p.agent_id = a.id WHERE p.id = cr.policy_id),
      (SELECT m.employee_id FROM misps m JOIN policies p ON p.misp_id = m.id WHERE p.id = cr.policy_id)
    ) as employee_id,
    (SELECT agent_id FROM policies WHERE id = cr.policy_id) as agent_id,
    (SELECT misp_id FROM policies WHERE id = cr.policy_id) as misp_id,
    COALESCE(
      (SELECT name FROM employees WHERE id = (SELECT employee_id FROM policies WHERE id = cr.policy_id)),
      (SELECT e.name FROM employees e JOIN agents a ON a.employee_id = e.id JOIN policies p ON p.agent_id = a.id WHERE p.id = cr.policy_id),
      (SELECT e.name FROM employees e JOIN misps m ON m.employee_id = e.id JOIN policies p ON p.misp_id = m.id WHERE p.id = cr.policy_id)
    ) as employee_name,
    (SELECT a.agent_name FROM agents a JOIN policies p ON p.agent_id = a.id WHERE p.id = cr.policy_id) as agent_name,
    (SELECT m.channel_partner_name FROM misps m JOIN policies p ON p.misp_id = m.id WHERE p.id = cr.policy_id) as misp_name,
    COALESCE(
      (SELECT a.employee_id FROM agents a JOIN policies p ON p.agent_id = a.id WHERE p.id = cr.policy_id),
      (SELECT m.employee_id FROM misps m JOIN policies p ON p.misp_id = m.id WHERE p.id = cr.policy_id)
    ) as reporting_employee_id,
    COALESCE(
      (SELECT e.name FROM employees e JOIN agents a ON a.employee_id = e.id JOIN policies p ON p.agent_id = a.id WHERE p.id = cr.policy_id),
      (SELECT e.name FROM employees e JOIN misps m ON m.employee_id = e.id JOIN policies p ON p.misp_id = m.id WHERE p.id = cr.policy_id)
    ) as reporting_employee_name,
    (SELECT CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) FROM customers c JOIN policies p ON p.customer_id = c.id WHERE p.id = cr.policy_id) as customer_name,
    (SELECT org_id FROM policies WHERE id = cr.policy_id) as org_id,
    (SELECT COALESCE(premium_with_gst, premium_without_gst, gross_premium, 0) FROM policies WHERE id = cr.policy_id) as premium,
    cr.base_commission_rate as base_rate,
    cr.reward_commission_rate as reward_rate,
    cr.bonus_commission_rate as bonus_rate,
    cr.total_commission_rate as total_rate,
    cr.insurer_commission,
    cr.agent_commission,
    cr.employee_commission,
    cr.reporting_employee_commission,
    cr.broker_share,
    'calculated' as commission_status,
    cr.calc_date
  FROM calculate_enhanced_comprehensive_commission_report(p_org_id) cr
  WHERE (p_org_id IS NULL OR (SELECT org_id FROM policies WHERE id = cr.policy_id) = p_org_id);
END;
$function$;