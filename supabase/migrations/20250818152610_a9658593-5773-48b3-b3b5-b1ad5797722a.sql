-- Fix RLS policies for tables that need them
-- Add proper RLS policies for new tables and fix type casting issues

-- RLS policies for organizations table
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

-- RLS policies for documents table
CREATE POLICY "Tenant users can manage their documents" 
ON public.documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND (p.tenant_id = documents.tenant_id OR p.role = 'system_admin'::app_role)
  )
);

-- RLS policies for status_master table
CREATE POLICY "All authenticated users can read status_master" 
ON public.status_master 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

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

CREATE OR REPLACE FUNCTION get_org_hierarchy(p_tenant_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  parent_id uuid,
  level integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH RECURSIVE org_tree AS (
    -- Base case: root organizations
    SELECT 
      o.id,
      o.name,
      o.parent_id,
      1 as level
    FROM public.organizations o
    WHERE o.tenant_id = p_tenant_id 
    AND o.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child organizations
    SELECT 
      o.id,
      o.name,
      o.parent_id,
      ot.level + 1
    FROM public.organizations o
    INNER JOIN org_tree ot ON o.parent_id = ot.id
    WHERE o.tenant_id = p_tenant_id
  )
  SELECT * FROM org_tree
  WHERE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND (profiles.tenant_id = p_tenant_id OR profiles.role = 'system_admin'::app_role)
  );
$$;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_status_master_updated_at
    BEFORE UPDATE ON public.status_master
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();