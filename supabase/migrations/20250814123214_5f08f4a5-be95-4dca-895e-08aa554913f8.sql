-- Create temporary policies that allow all authenticated users to manage LOBs
-- This is for debugging - we'll make it more restrictive later

DROP POLICY IF EXISTS "System admins can insert line of business" ON public.master_line_of_business;
DROP POLICY IF EXISTS "System admins can update line of business" ON public.master_line_of_business;  
DROP POLICY IF EXISTS "System admins can delete line of business" ON public.master_line_of_business;

-- Temporary policy to allow all operations for debugging
CREATE POLICY "Allow all operations on line of business" 
ON public.master_line_of_business 
FOR ALL 
USING (true)
WITH CHECK (true);