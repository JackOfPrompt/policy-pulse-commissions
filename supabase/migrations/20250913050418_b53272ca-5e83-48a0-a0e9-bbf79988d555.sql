-- Fix RLS policies for user_organizations table to allow super admins to manage all user-org mappings

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage user organizations" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;

-- Create improved policies
CREATE POLICY "Super admins can manage all user organizations" 
ON user_organizations 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Users can view their own organization memberships" 
ON user_organizations 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Create policy to allow organization admins to manage their org's user mappings
CREATE POLICY "Org admins can manage their organization users"
ON user_organizations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    JOIN profiles p ON p.id = auth.uid()
    WHERE uo.user_id = auth.uid()
    AND uo.org_id = user_organizations.org_id
    AND uo.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    JOIN profiles p ON p.id = auth.uid()
    WHERE uo.user_id = auth.uid()
    AND uo.org_id = user_organizations.org_id
    AND uo.role = 'admin'
  )
);