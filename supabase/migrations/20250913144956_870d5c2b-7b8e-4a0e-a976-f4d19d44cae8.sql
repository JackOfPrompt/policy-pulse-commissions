-- Drop the policies that reference user_metadata insecurely
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Super admins can manage all user organizations" ON user_organizations;

-- Create a new security definer function specifically for superadmin check
-- This avoids the infinite recursion by checking auth metadata directly in a function
CREATE OR REPLACE FUNCTION public.is_superadmin_by_email()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.jwt() ->> 'email' = 'superadmin@insurtech.com';
$$;

-- Create secure policies using existing functions and the new email check
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
USING (
  public.is_superadmin_by_email() 
  OR 
  public.is_superadmin()
);

CREATE POLICY "Super admins can manage all organizations"
ON organizations
FOR ALL
USING (
  public.is_superadmin_by_email() 
  OR 
  public.is_superadmin()
);

CREATE POLICY "Users can view organizations they belong to"
ON organizations
FOR SELECT
USING (
  public.is_superadmin_by_email() 
  OR 
  public.is_superadmin()
  OR
  id IN (
    SELECT org_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all user organizations"
ON user_organizations
FOR ALL
USING (
  public.is_superadmin_by_email() 
  OR 
  public.is_superadmin()
)
WITH CHECK (
  public.is_superadmin_by_email() 
  OR 
  public.is_superadmin()
);