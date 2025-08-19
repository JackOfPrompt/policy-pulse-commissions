-- Fix remaining functions by dropping and recreating with proper search_path

-- Drop and recreate get_departments_data function with correct signature
DROP FUNCTION IF EXISTS public.get_departments_data();

CREATE OR REPLACE FUNCTION public.get_departments_data()
RETURNS TABLE(department_id integer, department_name character varying, department_code character varying, tenant_id uuid, branch_id bigint, description text, status character varying, created_at timestamp without time zone, updated_at timestamp without time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    md.department_id,
    md.department_name,
    md.department_code,
    md.tenant_id,
    md.branch_id,
    md.description,
    md.status,
    md.created_at,
    md.updated_at
  FROM public.master_departments md
  ORDER BY md.created_at DESC;
$$;

-- Fix additional functions with search_path
CREATE OR REPLACE FUNCTION public.get_tenant_roles(p_tenant_id uuid)
RETURNS TABLE(user_id uuid, role app_role, first_name text, last_name text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    p.user_id,
    p.role,
    p.first_name,
    p.last_name,
    p.email
  FROM public.profiles p
  WHERE p.tenant_id = p_tenant_id
  AND (
    -- Only allow access if user is from same tenant or system admin
    EXISTS (
      SELECT 1 FROM public.profiles auth_profile
      WHERE auth_profile.user_id = auth.uid()
      AND (auth_profile.tenant_id = p_tenant_id OR auth_profile.role = 'system_admin'::app_role)
    )
  );
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;