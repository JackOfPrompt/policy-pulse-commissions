-- Create function to get departments data
CREATE OR REPLACE FUNCTION public.get_departments_data()
RETURNS TABLE(
  department_id integer,
  department_name character varying,
  department_code character varying,
  tenant_id integer,
  branch_id integer,
  description text,
  status character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone
)
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

-- Create function to create department
CREATE OR REPLACE FUNCTION public.create_department(
  p_department_name character varying,
  p_department_code character varying,
  p_tenant_id integer DEFAULT NULL,
  p_branch_id integer DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_status character varying DEFAULT 'Active'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.master_departments (
    department_name,
    department_code,
    tenant_id,
    branch_id,
    description,
    status
  ) VALUES (
    p_department_name,
    p_department_code,
    p_tenant_id,
    p_branch_id,
    p_description,
    p_status
  );
END;
$$;

-- Create function to update department
CREATE OR REPLACE FUNCTION public.update_department(
  p_department_id integer,
  p_department_name character varying DEFAULT NULL,
  p_department_code character varying DEFAULT NULL,
  p_tenant_id integer DEFAULT NULL,
  p_branch_id integer DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_status character varying DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.master_departments 
  SET 
    department_name = COALESCE(p_department_name, department_name),
    department_code = COALESCE(p_department_code, department_code),
    tenant_id = COALESCE(p_tenant_id, tenant_id),
    branch_id = COALESCE(p_branch_id, branch_id),
    description = COALESCE(p_description, description),
    status = COALESCE(p_status, status),
    updated_at = CURRENT_TIMESTAMP
  WHERE department_id = p_department_id;
END;
$$;