-- Fix RLS policies for organizations table to use profiles table directly
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;

-- Create new RLS policies that check profiles table
CREATE POLICY "Super admins can manage all organizations" 
ON organizations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

CREATE POLICY "Users can view organizations they belong to" 
ON organizations 
FOR SELECT 
USING (
  -- Super admins can see all
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
  OR
  -- Users can see orgs they belong to via user_organizations
  id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
);