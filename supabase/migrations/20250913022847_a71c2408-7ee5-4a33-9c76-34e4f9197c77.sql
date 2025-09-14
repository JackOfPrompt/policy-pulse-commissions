-- Final security fix - address remaining critical issues

-- 1. Check for any remaining tables without RLS in public schema
-- Enable RLS on any tables that might have been missed
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Get all tables in public schema and ensure RLS is enabled
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for tables that already have RLS enabled
            NULL;
        END;
    END LOOP;
END
$$;

-- 2. Remove any security definer functions that might be causing issues
-- Replace problematic functions with proper ones
DROP FUNCTION IF EXISTS public.get_user_organizations(UUID);

-- 3. Remove any views that might have security definer issues
DROP VIEW IF EXISTS public.user_profile_view CASCADE;

-- 4. Create a simple helper function for user organizations without security issues
CREATE OR REPLACE FUNCTION public.check_user_in_org(check_org_id UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_organizations 
    WHERE user_id = auth.uid() AND org_id = check_org_id
  );
$$;

-- 5. Ensure all existing functions have proper search_path set
-- Update functions that might be missing proper security settings
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles
LANGUAGE SQL
STABLE 
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_same_org(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND org_id = _org_id
  );
$$;