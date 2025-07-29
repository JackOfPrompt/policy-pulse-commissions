-- Create enum for createdByType
CREATE TYPE public.created_by_type AS ENUM ('Agent', 'Employee');

-- Add the new column to policies_new table
ALTER TABLE public.policies_new 
ADD COLUMN created_by_type public.created_by_type;

-- Add constraint to ensure validation logic
-- If created_by_type = 'Agent', then agent_id must be NOT NULL and employee_id must be NULL
-- If created_by_type = 'Employee', then employee_id must be NOT NULL and agent_id must be NULL
ALTER TABLE public.policies_new 
ADD CONSTRAINT check_created_by_type_validation 
CHECK (
  (created_by_type = 'Agent' AND agent_id IS NOT NULL AND employee_id IS NULL) OR
  (created_by_type = 'Employee' AND employee_id IS NOT NULL AND agent_id IS NULL)
);

-- Create index for better performance on created_by_type queries
CREATE INDEX idx_policies_new_created_by_type ON public.policies_new(created_by_type);

-- Update the policies_with_details view to include the new field
DROP VIEW IF EXISTS public.policies_with_details;

CREATE VIEW public.policies_with_details AS
SELECT 
  p.*,
  ip.provider_name as insurer_name,
  prod.name as product_name,
  a.name as agent_name,
  e.name as employee_name,
  b.name as branch_name
FROM public.policies_new p
LEFT JOIN public.insurance_providers ip ON p.insurer_id = ip.id
LEFT JOIN public.insurance_products prod ON p.product_id = prod.id
LEFT JOIN public.agents a ON p.agent_id = a.id
LEFT JOIN public.employees e ON p.employee_id = e.id
LEFT JOIN public.branches b ON p.branch_id = b.id;