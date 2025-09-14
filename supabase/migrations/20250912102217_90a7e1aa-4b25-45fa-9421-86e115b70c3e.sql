-- Fix RLS recursion by using a SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_organizations
    WHERE user_id = auth.uid()
      AND role = 'superadmin'
  );
$$;

-- Update user_organizations policy to avoid recursive self-select
DROP POLICY IF EXISTS "Super admins can manage user organizations" ON public.user_organizations;
CREATE POLICY "Super admins can manage user organizations"
ON public.user_organizations
FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());