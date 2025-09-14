-- Fix remaining function search path issues

-- Update all functions to have proper search_path set
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN 
LANGUAGE SQL 
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

CREATE OR REPLACE FUNCTION public.get_user_role_in_org(user_uuid UUID, organization_id UUID)
RETURNS TEXT 
LANGUAGE SQL 
STABLE 
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_organizations 
  WHERE user_id = user_uuid AND org_id = organization_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role_in_any_org(user_uuid UUID, check_role TEXT)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_organizations 
    WHERE user_id = user_uuid AND role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.check_user_in_org(check_org_id UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_organizations 
    WHERE user_id = auth.uid() AND org_id = check_org_id
  );
$$;