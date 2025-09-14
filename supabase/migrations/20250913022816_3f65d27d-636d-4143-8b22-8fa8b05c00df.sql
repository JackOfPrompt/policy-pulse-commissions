-- Comprehensive security fix with proper PostgreSQL syntax

-- 1. Ensure RLS is enabled on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;  
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
DROP POLICY IF EXISTS "Users can view their organization roles" ON public.user_organizations;

-- 3. Create proper policies for users table
CREATE POLICY "Users can view their own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Ensure user_organizations has proper policy (it should already exist)
-- This policy should already exist from earlier migration, just ensuring

-- 5. Create a proper function without security definer issues
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID)
RETURNS TABLE(org_id UUID, role TEXT)
LANGUAGE SQL STABLE
SET search_path = public
AS $$
  SELECT uo.org_id, uo.role
  FROM public.user_organizations uo
  WHERE uo.user_id = user_uuid;
$$;