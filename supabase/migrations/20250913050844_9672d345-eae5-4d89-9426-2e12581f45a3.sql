-- Fix infinite recursion in user_organizations RLS policies

-- Drop all existing policies on user_organizations
DROP POLICY IF EXISTS "Super admins can manage all user organizations" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org admins can manage their organization users" ON user_organizations;

-- Create simplified policies without recursion
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

-- Users can only view their own organization memberships
CREATE POLICY "Users can view their own organization memberships" 
ON user_organizations 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());