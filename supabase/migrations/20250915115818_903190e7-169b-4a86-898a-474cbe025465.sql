-- Drop the view if it exists (safety)
DROP VIEW IF EXISTS public.policy_commission_distribution_view;

-- Create a new reporting view
CREATE VIEW public.policy_commission_distribution_view AS
SELECT 
  p.id AS policy_id,
  dist.policy_number,
  dist.product_type,
  dist.customer_name,
  dist.premium_amount,
  dist.provider,
  dist.source_type,
  dist.source_name,
  dist.insurer_commission_rate,
  dist.insurer_commission_amount,
  dist.agent_commission_rate,
  dist.agent_commission_amount,
  dist.misp_commission_rate,
  dist.misp_commission_amount,
  dist.employee_commission_rate,
  dist.employee_commission_amount,
  dist.broker_share_rate,
  dist.broker_share_amount,
  dist.commission_status,
  dist.grid_source,
  dist.calc_date
FROM policies p
CROSS JOIN LATERAL public.calculate_enhanced_commission_distribution(p.id) dist;