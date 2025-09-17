-- Update the sync_revenue_table function to use base_percentage instead of percentage
CREATE OR REPLACE FUNCTION public.sync_revenue_table_comprehensive(p_org_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  commission_rec RECORD;
BEGIN
  -- Clear existing data for the org (or all if no org specified)
  IF p_org_id IS NOT NULL THEN
    DELETE FROM revenue_table WHERE org_id = p_org_id;
  ELSE
    DELETE FROM revenue_table;
  END IF;

  -- Insert comprehensive commission data using base_percentage
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
      re.id as reporting_employee_id,
      re.name as reporting_employee_name,
      COALESCE(pc.commission_rate, 0) as commission_rate,
      COALESCE(pc.reward_rate, 0) as reward_rate,
      COALESCE(pc.insurer_commission, 0) as insurer_commission,
      -- Calculate agent commission using base_percentage
      CASE 
        WHEN p.source_type = 'agent' AND a.base_percentage IS NOT NULL THEN 
          COALESCE(pc.insurer_commission, 0) * a.base_percentage / 100
        ELSE 0
      END as agent_commission,
      -- Calculate MISP commission using percentage
      CASE 
        WHEN p.source_type = 'misp' AND m.percentage IS NOT NULL THEN 
          COALESCE(pc.insurer_commission, 0) * m.percentage / 100
        ELSE 0
      END as misp_commission,
      -- Employee commission gets full insurer commission for direct sales
      CASE 
        WHEN p.source_type = 'employee' THEN COALESCE(pc.insurer_commission, 0)
        ELSE 0
      END as employee_commission,
      -- Reporting employee commission (when agent/misp reports to employee)
      CASE 
        WHEN p.source_type = 'agent' AND a.employee_id IS NOT NULL AND a.base_percentage IS NOT NULL THEN 
          COALESCE(pc.insurer_commission, 0) - (COALESCE(pc.insurer_commission, 0) * a.base_percentage / 100)
        WHEN p.source_type = 'misp' AND m.employee_id IS NOT NULL AND m.percentage IS NOT NULL THEN 
          COALESCE(pc.insurer_commission, 0) - (COALESCE(pc.insurer_commission, 0) * m.percentage / 100)
        ELSE 0
      END as reporting_employee_commission,
      COALESCE(pc.broker_share, 0) as broker_share,
      COALESCE(pc.commission_status, 'calculated') as commission_status,
      COALESCE(pc.calc_date, p.created_at) as calc_date
    FROM policies p
    JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN employees e ON e.id = p.employee_id
    LEFT JOIN agents a ON a.id = p.agent_id
    LEFT JOIN misps m ON m.id = p.misp_id
    LEFT JOIN employees re ON re.id = a.employee_id OR re.id = m.employee_id
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
      commission_rec.reporting_employee_commission,
      commission_rec.broker_share,
      commission_rec.commission_status,
      commission_rec.calc_date
    );
  END LOOP;
END;
$$;