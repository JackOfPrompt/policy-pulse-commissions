-- Update revenue_table to populate reporting_employee_id from agents table
CREATE OR REPLACE FUNCTION sync_revenue_table_with_reporting_managers(p_org_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update revenue_table records to include reporting_employee_id and name from agents
  UPDATE revenue_table rt
  SET 
    reporting_employee_id = a.reporting_manager_id,
    reporting_employee_name = e.name
  FROM agents a
  LEFT JOIN employees e ON e.id = a.reporting_manager_id
  WHERE rt.agent_id = a.id
    AND (p_org_id IS NULL OR rt.org_id = p_org_id);

  -- Update revenue_table records for MISPs to include reporting_employee_id from their assigned employee
  UPDATE revenue_table rt
  SET 
    reporting_employee_id = m.employee_id,
    reporting_employee_name = e.name
  FROM misps m
  LEFT JOIN employees e ON e.id = m.employee_id
  WHERE rt.misp_id = m.id
    AND rt.reporting_employee_id IS NULL
    AND (p_org_id IS NULL OR rt.org_id = p_org_id);

  -- For direct employee sales, the reporting_employee_id should be the employee's reporting manager
  UPDATE revenue_table rt
  SET 
    reporting_employee_id = emp.reporting_employee_id,
    reporting_employee_name = mgr.name
  FROM employees emp
  LEFT JOIN employees mgr ON mgr.id = emp.reporting_employee_id
  WHERE rt.employee_id = emp.id
    AND rt.source_type = 'internal'
    AND rt.reporting_employee_id IS NULL
    AND (p_org_id IS NULL OR rt.org_id = p_org_id);
END;
$function$;

-- Run the sync function to update existing revenue table records
SELECT sync_revenue_table_with_reporting_managers();

-- Update the main revenue sync function to include reporting employee logic
CREATE OR REPLACE FUNCTION sync_revenue_table_comprehensive(p_org_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  commission_rec RECORD;
BEGIN
  -- Clear existing data for the org (or all if no org specified)
  IF p_org_id IS NOT NULL THEN
    DELETE FROM revenue_table WHERE org_id = p_org_id;
  ELSE
    DELETE FROM revenue_table;
  END IF;

  -- Insert comprehensive commission data with reporting employee information
  FOR commission_rec IN 
    SELECT 
      p.id as policy_id,
      p.policy_number,
      p.provider,
      p.source_type,
      p.employee_id,
      p.agent_id,
      p.misp_id,
      p.org_id,
      pt.name as product_type,
      COALESCE(p.premium_with_gst, p.premium_without_gst, p.gross_premium, 0) as premium,
      CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
      e.name as employee_name,
      a.agent_name,
      m.channel_partner_name as misp_name,
      -- Get reporting employee based on source type
      CASE 
        WHEN p.source_type = 'external' AND p.agent_id IS NOT NULL THEN a.reporting_manager_id
        WHEN p.source_type = 'external' AND p.misp_id IS NOT NULL THEN m.employee_id
        WHEN p.source_type = 'internal' AND p.employee_id IS NOT NULL THEN e.reporting_employee_id
        ELSE NULL
      END as reporting_employee_id,
      CASE 
        WHEN p.source_type = 'external' AND p.agent_id IS NOT NULL THEN re_agent.name
        WHEN p.source_type = 'external' AND p.misp_id IS NOT NULL THEN re_misp.name
        WHEN p.source_type = 'internal' AND p.employee_id IS NOT NULL THEN re_emp.name
        ELSE NULL
      END as reporting_employee_name,
      COALESCE(pc.commission_rate, 0) as commission_rate,
      COALESCE(pc.reward_rate, 0) as reward_rate,
      COALESCE(pc.insurer_commission, 0) as insurer_commission,
      COALESCE(pc.agent_commission, 0) as agent_commission,
      COALESCE(pc.misp_commission, 0) as misp_commission,
      COALESCE(pc.employee_commission, 0) as employee_commission,
      COALESCE(pc.broker_share, 0) as broker_share,
      COALESCE(pc.commission_status, 'calculated') as commission_status,
      COALESCE(pc.calc_date, p.created_at) as calc_date
    FROM policies p
    JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN employees e ON e.id = p.employee_id
    LEFT JOIN agents a ON a.id = p.agent_id
    LEFT JOIN misps m ON m.id = p.misp_id
    LEFT JOIN employees re_agent ON re_agent.id = a.reporting_manager_id
    LEFT JOIN employees re_misp ON re_misp.id = m.employee_id
    LEFT JOIN employees re_emp ON re_emp.id = e.reporting_employee_id
    LEFT JOIN policy_commissions pc ON pc.policy_id = p.id AND pc.is_active = true
    WHERE p.policy_status = 'active'
      AND (p_org_id IS NULL OR p.org_id = p_org_id)
  LOOP
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
    ) VALUES (
      commission_rec.policy_id,
      commission_rec.policy_number,
      commission_rec.provider,
      commission_rec.product_type,
      commission_rec.source_type,
      commission_rec.employee_id,
      commission_rec.agent_id,
      commission_rec.misp_id,
      commission_rec.employee_name,
      commission_rec.agent_name,
      commission_rec.misp_name,
      commission_rec.reporting_employee_id,
      commission_rec.reporting_employee_name,
      commission_rec.customer_name,
      commission_rec.org_id,
      commission_rec.premium,
      commission_rec.commission_rate,
      commission_rec.reward_rate,
      0, -- bonus_rate placeholder
      commission_rec.commission_rate + commission_rec.reward_rate,
      commission_rec.insurer_commission,
      commission_rec.agent_commission,
      commission_rec.employee_commission,
      0, -- reporting_employee_commission placeholder  
      commission_rec.broker_share,
      commission_rec.commission_status,
      commission_rec.calc_date
    );
  END LOOP;
END;
$function$;