-- First, let's check if there are any employees with NULL branch_id
-- If there are, we need to handle them before making the field required

-- Update any NULL branch_id values to a default branch if needed
-- For now, we'll just add the foreign key constraint and keep the field nullable
-- until we ensure all employees have proper branch assignments

-- Add foreign key constraint from employees.branch_id to branches.id
ALTER TABLE public.employees 
ADD CONSTRAINT fk_employees_branch_id 
FOREIGN KEY (branch_id) REFERENCES public.branches(id);

-- Add an index for better performance on the foreign key
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON public.employees(branch_id);

-- Note: We're keeping branch_id nullable for now to avoid data issues
-- It can be made NOT NULL later once all employees have proper branch assignments