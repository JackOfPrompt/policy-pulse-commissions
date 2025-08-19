-- Fix RLS policies for tables that need them (avoid duplicates)
-- Add proper RLS policies for new tables and fix type casting issues

-- RLS policies for organizations table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'organizations' 
    AND policyname = 'Tenant admins can manage their organizations'
  ) THEN
    CREATE POLICY "Tenant admins can manage their organizations" 
    ON public.organizations 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND (profiles.tenant_id = organizations.tenant_id OR profiles.role = 'system_admin'::app_role)
        AND profiles.role = ANY(ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'organizations' 
    AND policyname = 'Tenant users can view their organizations'
  ) THEN
    CREATE POLICY "Tenant users can view their organizations" 
    ON public.organizations 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND (profiles.tenant_id = organizations.tenant_id OR profiles.role = 'system_admin'::app_role)
      )
    );
  END IF;
END $$;

-- RLS policies for status_master table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'status_master' 
    AND policyname = 'All authenticated users can read status_master'
  ) THEN
    CREATE POLICY "All authenticated users can read status_master" 
    ON public.status_master 
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'status_master' 
    AND policyname = 'System admins can manage status_master'
  ) THEN
    CREATE POLICY "System admins can manage status_master" 
    ON public.status_master 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'system_admin'::app_role
      )
    );
  END IF;
END $$;

-- Fix type casting issues in existing RLS policies
-- Update policies that have tenant_id type casting issues

-- Fix insurer_statement_items policies
DROP POLICY IF EXISTS "Tenant admins can manage insurer statement items" ON public.insurer_statement_items;
DROP POLICY IF EXISTS "Tenant users can view insurer statement items" ON public.insurer_statement_items;

CREATE POLICY "Tenant admins can manage insurer statement items" 
ON public.insurer_statement_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.tenant_id::text = insurer_statement_items.tenant_id::text OR profiles.role = 'system_admin'::app_role)
    AND profiles.role = ANY(ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
  )
);

CREATE POLICY "Tenant users can view insurer statement items" 
ON public.insurer_statement_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.tenant_id::text = insurer_statement_items.tenant_id::text OR profiles.role = 'system_admin'::app_role)
  )
);

-- Fix security definer views by removing them and creating proper tables/functions
-- Drop problematic security definer views
DROP VIEW IF EXISTS tenant_roles CASCADE;
DROP VIEW IF EXISTS org_hierarchy CASCADE;
DROP VIEW IF EXISTS employee_details CASCADE;
DROP VIEW IF EXISTS agent_performance CASCADE;

-- Create replacement functions that are security definer but safer
CREATE OR REPLACE FUNCTION get_tenant_roles(p_tenant_id uuid)
RETURNS TABLE(
  user_id uuid,
  role app_role,
  first_name text,
  last_name text,
  email text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
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

-- Create updated_at triggers for new tables (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_organizations_updated_at'
  ) THEN
    CREATE TRIGGER update_organizations_updated_at
        BEFORE UPDATE ON public.organizations
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_status_master_updated_at'
  ) THEN
    CREATE TRIGGER update_status_master_updated_at
        BEFORE UPDATE ON public.status_master
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;