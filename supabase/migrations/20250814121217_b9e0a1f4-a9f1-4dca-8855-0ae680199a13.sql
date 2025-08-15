-- Create security definer function to check if user is system admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'::app_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policy that might cause infinite recursion
DROP POLICY IF EXISTS "System admins can manage line of business" ON public.master_line_of_business;

-- Create new policy using the security definer function
CREATE POLICY "System admins can manage line of business" 
ON public.master_line_of_business 
FOR ALL 
USING (public.is_system_admin());

-- Also ensure authenticated users can read LOBs
DROP POLICY IF EXISTS "Allow authenticated users to read line of business" ON public.master_line_of_business;
CREATE POLICY "Allow authenticated users to read line of business" 
ON public.master_line_of_business 
FOR SELECT 
USING (true);