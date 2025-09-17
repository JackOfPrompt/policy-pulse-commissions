-- Create the policy_commission_distribution_view that was referenced in the edge function
CREATE VIEW policy_commission_distribution_view AS
SELECT 
  p.id as policy_id,
  p.policy_number,
  p.org_id,
  pt.category as product_type,
  pt.name as product_name,
  p.provider,
  p.plan_name,
  p.source_type,
  p.employee_id,
  p.agent_id,
  p.misp_id,
  COALESCE(p.premium_with_gst, p.premium_without_gst, p.gross_premium, 0) as premium_amount,
  pc.commission_rate,
  pc.reward_rate,
  pc.commission_amount,
  pc.reward_amount,
  pc.total_amount,
  pc.insurer_commission,
  pc.agent_commission,
  pc.misp_commission,
  pc.employee_commission,
  pc.broker_share,
  pc.commission_status,
  pc.calc_date,
  -- Customer details
  CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  -- Source details
  e.name as employee_name,
  a.agent_name,
  m.channel_partner_name as misp_name,
  p.created_at,
  p.updated_at
FROM policies p
JOIN product_types pt ON pt.id = p.product_type_id
LEFT JOIN customers c ON c.id = p.customer_id
LEFT JOIN employees e ON e.id = p.employee_id
LEFT JOIN agents a ON a.id = p.agent_id
LEFT JOIN misps m ON m.id = p.misp_id
LEFT JOIN policy_commissions pc ON pc.policy_id = p.id AND pc.is_active = true
WHERE p.policy_status = 'active';