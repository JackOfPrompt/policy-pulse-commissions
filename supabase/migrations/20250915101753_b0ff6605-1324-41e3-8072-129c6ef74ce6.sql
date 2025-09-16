-- Fix the view creation (views inherit RLS from underlying tables)
DROP VIEW IF EXISTS policy_commission_report;

CREATE VIEW policy_commission_report AS
SELECT 
  p.id as policy_id,
  p.policy_number,
  pt.category as product_type,
  pt.name as product_name,
  p.start_date as policy_startdate,
  p.end_date as policy_enddate,
  p.customer_id,
  COALESCE(c.company_name, CONCAT(c.first_name, ' ', c.last_name)) as customer_name,
  COALESCE(p.premium_with_gst, p.premium_without_gst, 0) as premium_amount,
  pc.insurer_commission,
  pc.agent_commission,
  pc.misp_commission,
  pc.employee_commission,
  pc.broker_share,
  pc.commission_status,
  pc.calc_date,
  p.org_id,
  p.created_at,
  -- Source details
  p.source_type,
  CASE 
    WHEN p.source_type = 'agent' THEN a.agent_name
    WHEN p.source_type = 'misp' THEN m.channel_partner_name
    WHEN p.source_type = 'employee' THEN e.name
    ELSE 'Direct'
  END as source_name
FROM policies p
JOIN product_types pt ON pt.id = p.product_type_id
JOIN customers c ON c.id = p.customer_id
LEFT JOIN policy_commissions pc ON pc.policy_id = p.id AND pc.is_active = true
LEFT JOIN agents a ON a.id = p.agent_id
LEFT JOIN misps m ON m.id = p.misp_id  
LEFT JOIN employees e ON e.id = p.employee_id
WHERE p.policy_status = 'active';