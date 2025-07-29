-- Fix the view security issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.policies_with_details;

CREATE VIEW public.policies_with_details AS
SELECT 
  p.*,
  ip.provider_name as insurer_name,
  pr.name as product_name,
  a.name as agent_name,
  e.name as employee_name,
  b.name as branch_name
FROM public.policies_new p
LEFT JOIN public.insurance_providers ip ON p.insurer_id = ip.id
LEFT JOIN public.insurance_products pr ON p.product_id = pr.id
LEFT JOIN public.agents a ON p.agent_id = a.id
LEFT JOIN public.employees e ON p.employee_id = e.id
LEFT JOIN public.branches b ON p.branch_id = b.id;

-- Enable RLS on the view
ALTER VIEW public.policies_with_details SET (security_invoker = true);