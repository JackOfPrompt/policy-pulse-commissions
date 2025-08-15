-- Fix the RLS policies for master_line_of_business to allow system admins to update
DROP POLICY IF EXISTS "System admins can manage line of business" ON public.master_line_of_business;

-- Create separate policies for each operation
CREATE POLICY "System admins can insert line of business" 
ON public.master_line_of_business 
FOR INSERT 
WITH CHECK (is_system_admin());

CREATE POLICY "System admins can update line of business" 
ON public.master_line_of_business 
FOR UPDATE 
USING (is_system_admin())
WITH CHECK (is_system_admin());

CREATE POLICY "System admins can delete line of business" 
ON public.master_line_of_business 
FOR DELETE 
USING (is_system_admin());