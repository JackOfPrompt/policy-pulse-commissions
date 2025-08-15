-- Fix infinite recursion in RLS policies by creating security definer functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow reading profiles for authentication" ON public.profiles;
DROP POLICY IF EXISTS "System admins can manage user credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "System admins can view all credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "System admins can insert user credentials" ON public.user_credentials;
DROP POLICY IF EXISTS "System admins can update user credentials" ON public.user_credentials;

-- Create security definer function to check if user is system admin
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = 'system_admin'::app_role
  )
$$;

-- Create security definer function to check if credentials are active
CREATE OR REPLACE FUNCTION public.are_credentials_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_credentials
    WHERE id = _user_id
      AND is_active = true
  )
$$;

-- Recreate profiles policies without circular dependency
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_system_admin(auth.uid()));

-- Recreate user_credentials policies without circular dependency
CREATE POLICY "Allow public read for authentication"
ON public.user_credentials
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own password"
ON public.user_credentials
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "System admins can manage all credentials"
ON public.user_credentials
FOR ALL
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can insert credentials"
ON public.user_credentials
FOR INSERT
WITH CHECK (public.is_system_admin(auth.uid()));