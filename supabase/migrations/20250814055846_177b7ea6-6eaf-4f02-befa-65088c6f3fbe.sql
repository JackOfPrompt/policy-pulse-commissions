-- Drop ALL policies that cause circular dependency
DROP POLICY IF EXISTS "Allow reading profiles for authentication" ON public.profiles;
DROP POLICY IF EXISTS "System admins can manage user credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "System admins can view all credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "System admins can insert user credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "System admins can update user credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "Users can view their own credentials" ON public.user_credentials;

-- Simple, non-circular policies for user_credentials
CREATE POLICY "Allow public read for authentication"
ON public.user_credentials
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own password"
ON public.user_credentials
FOR UPDATE
USING (id = auth.uid());

-- For profiles, allow simple access without cross-table references
CREATE POLICY "Allow authenticated users to read profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');