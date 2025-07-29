-- Add referred_by_employee_id to agents table for proper relationship
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS referred_by_employee_id UUID;

-- Add foreign key constraint to ensure data integrity
ALTER TABLE public.agents 
ADD CONSTRAINT fk_agents_referred_by_employee 
FOREIGN KEY (referred_by_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;