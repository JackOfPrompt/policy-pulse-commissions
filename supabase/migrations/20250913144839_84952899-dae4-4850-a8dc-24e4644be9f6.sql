-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies that don't cause recursion
-- Super admins can manage all profiles (using auth metadata instead of profiles table)
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
USING (
  auth.jwt() ->> 'email' = 'superadmin@insurtech.com' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'superadmin@insurtech.com' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
);

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (needed for new user registration)
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Fix organizations policies to not rely on profiles table
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;

-- Create new organization policies
CREATE POLICY "Super admins can manage all organizations"
ON organizations
FOR ALL
USING (
  auth.jwt() ->> 'email' = 'superadmin@insurtech.com' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
);

CREATE POLICY "Users can view organizations they belong to"
ON organizations
FOR SELECT
USING (
  auth.jwt() ->> 'email' = 'superadmin@insurtech.com' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
  OR
  id IN (
    SELECT org_id 
    FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Fix user_organizations policies
DROP POLICY IF EXISTS "Super admins can manage all user organizations" ON user_organizations;

CREATE POLICY "Super admins can manage all user organizations"
ON user_organizations
FOR ALL
USING (
  auth.jwt() ->> 'email' = 'superadmin@insurtech.com' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'superadmin@insurtech.com' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
);