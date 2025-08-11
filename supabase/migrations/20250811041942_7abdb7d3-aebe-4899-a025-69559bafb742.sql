-- Department Assignment System Migration (tenant isolation aware)
-- 1) Ensure helper function is callable
GRANT EXECUTE ON FUNCTION public.current_user_tenant_ids() TO authenticated;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.tenant_branch_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  department_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  UNIQUE (tenant_id, branch_id, department_id)
);

CREATE TABLE IF NOT EXISTS public.employee_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  code varchar(20) UNIQUE NOT NULL,
  department_id uuid,
  permissions jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_department_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  department_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.employee_roles(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid,
  UNIQUE (tenant_id, employee_id, department_id, branch_id)
);

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_tbd_tenant_branch ON public.tenant_branch_departments(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_tbd_tenant_dept   ON public.tenant_branch_departments(tenant_id, department_id);
CREATE INDEX IF NOT EXISTS idx_eda_tenant_employee ON public.employee_department_assignments(tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_eda_tenant_branch_dept ON public.employee_department_assignments(tenant_id, branch_id, department_id);

-- 4) Foreign keys with safe checks for existing columns
DO $$
BEGIN
  -- tenant_branch_departments -> tenants(tenant_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tbd_tenant_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.tenant_branch_departments
             ADD CONSTRAINT fk_tbd_tenant_id
             FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE';
  END IF;

  -- tenant_branch_departments -> branches(branch_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tbd_branch_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.tenant_branch_departments
             ADD CONSTRAINT fk_tbd_branch_id
             FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE';
  END IF;

  -- tenant_branch_departments -> departments(department_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tbd_department_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.tenant_branch_departments
             ADD CONSTRAINT fk_tbd_department_id
             FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE';
  END IF;

  -- employee_department_assignments -> tenants(tenant_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_eda_tenant_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee_department_assignments
             ADD CONSTRAINT fk_eda_tenant_id
             FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE';
  END IF;

  -- employee_department_assignments -> branches(branch_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_eda_branch_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee_department_assignments
             ADD CONSTRAINT fk_eda_branch_id
             FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE';
  END IF;

  -- employee_department_assignments -> departments(department_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_eda_department_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee_department_assignments
             ADD CONSTRAINT fk_eda_department_id
             FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE';
  END IF;

  -- Conditionally add FK to employees(id) if table/column exists
  IF to_regclass('public.employees') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='employees' AND column_name='id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_eda_employee_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee_department_assignments
             ADD CONSTRAINT fk_eda_employee_id
             FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE';
  END IF;
END$$;

-- 5) Tenant isolation CHECK constraints (safe, adjusted column names)
DO $$
BEGIN
  -- Branch belongs to tenant (tbd)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tbd_branch_belongs_to_tenant'
  ) THEN
    EXECUTE 'ALTER TABLE public.tenant_branch_departments
             ADD CONSTRAINT chk_tbd_branch_belongs_to_tenant
             CHECK (EXISTS (
               SELECT 1 FROM public.branches b
               WHERE b.branch_id = branch_id AND b.tenant_id = tenant_id
             ))';
  END IF;

  -- Employee belongs to tenant (eda) — only if employees has tenant_id
  IF to_regclass('public.employees') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='employees' AND column_name='tenant_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_eda_employee_belongs_to_tenant'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee_department_assignments
             ADD CONSTRAINT chk_eda_employee_belongs_to_tenant
             CHECK (EXISTS (
               SELECT 1 FROM public.employees e
               WHERE e.id = employee_id AND e.tenant_id = tenant_id
             ))';
  END IF;

  -- Branch belongs to tenant (eda)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_eda_branch_belongs_to_tenant'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee_department_assignments
             ADD CONSTRAINT chk_eda_branch_belongs_to_tenant
             CHECK (EXISTS (
               SELECT 1 FROM public.branches b
               WHERE b.branch_id = branch_id AND b.tenant_id = tenant_id
             ))';
  END IF;

  -- Department assigned to branch (eda)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_eda_dept_assigned_to_branch'
  ) THEN
    EXECUTE 'ALTER TABLE public.employee_department_assignments
             ADD CONSTRAINT chk_eda_dept_assigned_to_branch
             CHECK (EXISTS (
               SELECT 1 FROM public.tenant_branch_departments tbd
               WHERE tbd.tenant_id = tenant_id
                 AND tbd.branch_id = branch_id
                 AND tbd.department_id = department_id
                 AND tbd.is_active = true
             ))';
  END IF;
END$$;

-- 6) Triggers to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_tbd_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER set_tbd_updated_at
             BEFORE UPDATE ON public.tenant_branch_departments
             FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_eda_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER set_eda_updated_at
             BEFORE UPDATE ON public.employee_department_assignments
             FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END$$;

-- 7) Enable RLS and policies
ALTER TABLE public.tenant_branch_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_department_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_roles ENABLE ROW LEVEL SECURITY;

-- tenant_branch_departments policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_branch_departments' AND policyname='tbd_select_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY tbd_select_own_tenant ON public.tenant_branch_departments
             FOR SELECT TO authenticated USING (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_branch_departments' AND policyname='tbd_insert_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY tbd_insert_own_tenant ON public.tenant_branch_departments
             FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_branch_departments' AND policyname='tbd_update_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY tbd_update_own_tenant ON public.tenant_branch_departments
             FOR UPDATE TO authenticated USING (tenant_id = ANY(public.current_user_tenant_ids())) WITH CHECK (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_branch_departments' AND policyname='tbd_delete_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY tbd_delete_own_tenant ON public.tenant_branch_departments
             FOR DELETE TO authenticated USING (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
END$$;

-- employee_department_assignments policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_department_assignments' AND policyname='eda_select_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY eda_select_own_tenant ON public.employee_department_assignments
             FOR SELECT TO authenticated USING (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_department_assignments' AND policyname='eda_insert_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY eda_insert_own_tenant ON public.employee_department_assignments
             FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_department_assignments' AND policyname='eda_update_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY eda_update_own_tenant ON public.employee_department_assignments
             FOR UPDATE TO authenticated USING (tenant_id = ANY(public.current_user_tenant_ids())) WITH CHECK (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_department_assignments' AND policyname='eda_delete_own_tenant'
  ) THEN
    EXECUTE 'CREATE POLICY eda_delete_own_tenant ON public.employee_department_assignments
             FOR DELETE TO authenticated USING (tenant_id = ANY(public.current_user_tenant_ids()))';
  END IF;
END$$;

-- employee_roles policies (global list, writes for admins only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_roles' AND policyname='er_select_all_auth'
  ) THEN
    EXECUTE 'CREATE POLICY er_select_all_auth ON public.employee_roles
             FOR SELECT TO authenticated USING (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='employee_roles' AND policyname='er_write_admin_only'
  ) THEN
    EXECUTE 'CREATE POLICY er_write_admin_only ON public.employee_roles
             FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin())';
  END IF;
END$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_branch_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_department_assignments TO authenticated;
GRANT SELECT ON public.employee_roles TO authenticated;

-- 8) Business logic functions (adjusted to existing columns)
CREATE OR REPLACE FUNCTION public.assign_departments_to_branch(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_department_ids uuid[],
  p_admin_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assigned_count integer := 0;
  dept_id uuid;
BEGIN
  -- Verify branch belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.branches
    WHERE branch_id = p_branch_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Branch % does not belong to tenant %', p_branch_id, p_tenant_id;
  END IF;

  FOREACH dept_id IN ARRAY p_department_ids LOOP
    INSERT INTO public.tenant_branch_departments (tenant_id, branch_id, department_id, created_by)
    VALUES (p_tenant_id, p_branch_id, dept_id, p_admin_id)
    ON CONFLICT (tenant_id, branch_id, department_id)
    DO UPDATE SET is_active = true, updated_by = p_admin_id, updated_at = now();
    assigned_count := assigned_count + 1;
  END LOOP;

  RETURN assigned_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_departments_to_branch(uuid, uuid, uuid[], uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_branch_departments(
  p_tenant_id uuid,
  p_branch_id uuid
) RETURNS TABLE (
  department_id uuid,
  department_name varchar,
  department_code varchar,
  is_assigned boolean,
  assigned_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify branch belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.branches
    WHERE branch_id = p_branch_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Branch % does not belong to tenant %', p_branch_id, p_tenant_id;
  END IF;

  RETURN QUERY
  SELECT 
    d.department_id,
    d.name,
    d.code,
    CASE WHEN tbd.id IS NOT NULL AND tbd.is_active THEN true ELSE false END,
    tbd.created_at
  FROM public.departments d
  LEFT JOIN public.tenant_branch_departments tbd
    ON d.department_id = tbd.department_id
   AND tbd.tenant_id = p_tenant_id
   AND tbd.branch_id = p_branch_id
  WHERE d.is_active = true
  ORDER BY d.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_branch_departments(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_department_from_branch(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_department_id uuid,
  p_admin_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Block removal if active employees are assigned
  IF EXISTS (
    SELECT 1 FROM public.employee_department_assignments
    WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id
      AND department_id = p_department_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot remove department. Employees are still assigned to it.';
  END IF;

  UPDATE public.tenant_branch_departments
     SET is_active = false, updated_by = p_admin_id, updated_at = now()
   WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id AND department_id = p_department_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_department_from_branch(uuid, uuid, uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_employee_to_department(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_department_id uuid,
  p_employee_id uuid,
  p_role_id uuid,
  p_is_primary boolean DEFAULT false,
  p_start_date date DEFAULT CURRENT_DATE,
  p_admin_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assignment_id uuid;
  v_has_employees boolean;
BEGIN
  v_has_employees := to_regclass('public.employees') IS NOT NULL;

  -- Verify branch belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.branches WHERE branch_id = p_branch_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Branch does not belong to this tenant';
  END IF;

  -- Verify tenant-branch-department is active
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_branch_departments tbd
     WHERE tbd.tenant_id = p_tenant_id AND tbd.branch_id = p_branch_id
       AND tbd.department_id = p_department_id AND tbd.is_active = true
  ) THEN
    RAISE EXCEPTION 'Department is not assigned to this tenant-branch combination';
  END IF;

  -- Verify employee belongs to tenant if employees table exists and has tenant_id
  IF v_has_employees AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='employees' AND column_name='tenant_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employees e WHERE e.id = p_employee_id AND e.tenant_id = p_tenant_id
    ) THEN
      RAISE EXCEPTION 'Employee does not belong to this tenant';
    END IF;
  END IF;

  -- Make this the only primary if requested
  IF p_is_primary THEN
    UPDATE public.employee_department_assignments
       SET is_primary = false, updated_by = p_admin_id, updated_at = now()
     WHERE employee_id = p_employee_id AND tenant_id = p_tenant_id AND is_active = true;
  END IF;

  INSERT INTO public.employee_department_assignments (
    tenant_id, branch_id, department_id, employee_id, role_id,
    is_primary, start_date, created_by
  ) VALUES (
    p_tenant_id, p_branch_id, p_department_id, p_employee_id, p_role_id,
    p_is_primary, p_start_date, p_admin_id
  ) ON CONFLICT (tenant_id, employee_id, department_id, branch_id)
    DO UPDATE SET
      role_id = EXCLUDED.role_id,
      is_primary = EXCLUDED.is_primary,
      is_active = true,
      start_date = EXCLUDED.start_date,
      end_date = NULL,
      updated_by = p_admin_id,
      updated_at = now()
  RETURNING id INTO assignment_id;

  RETURN assignment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_employee_to_department(uuid, uuid, uuid, uuid, uuid, boolean, date, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_tenant_employee_assignments(
  p_tenant_id uuid,
  p_branch_id uuid DEFAULT NULL,
  p_department_id uuid DEFAULT NULL
) RETURNS TABLE (
  assignment_id uuid,
  employee_id uuid,
  employee_name varchar,
  employee_code varchar,
  branch_name varchar,
  department_name varchar,
  role_name varchar,
  is_primary boolean,
  start_date date,
  end_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_employees boolean;
  v_name_col text;
  v_code_col text;
  sql text;
BEGIN
  v_has_employees := to_regclass('public.employees') IS NOT NULL;

  IF v_has_employees THEN
    SELECT CASE WHEN EXISTS (
             SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='full_name'
           ) THEN 'full_name'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='name'
           ) THEN 'name'
           ELSE NULL END
      INTO v_name_col;

    SELECT CASE WHEN EXISTS (
             SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='employee_code'
           ) THEN 'employee_code'
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='code'
           ) THEN 'code'
           ELSE NULL END
      INTO v_code_col;
  END IF;

  sql := 'SELECT eda.id,
                 ' || (CASE WHEN v_has_employees THEN 'e.id' ELSE 'eda.employee_id' END) || ' AS employee_id,
                 ' || (CASE WHEN v_has_employees AND v_name_col IS NOT NULL THEN 'e.' || quote_ident(v_name_col) ELSE 'NULL::varchar' END) || ' AS employee_name,
                 ' || (CASE WHEN v_has_employees AND v_code_col IS NOT NULL THEN 'e.' || quote_ident(v_code_col) ELSE 'NULL::varchar' END) || ' AS employee_code,
                 b.branch_name,
                 d.name AS department_name,
                 er.name AS role_name,
                 eda.is_primary,
                 eda.start_date,
                 eda.end_date
          FROM public.employee_department_assignments eda
          JOIN public.branches b ON b.branch_id = eda.branch_id
          JOIN public.departments d ON d.department_id = eda.department_id
          JOIN public.employee_roles er ON er.id = eda.role_id ' ||
          (CASE WHEN v_has_employees THEN 'JOIN public.employees e ON e.id = eda.employee_id ' ELSE '' END) ||
          'WHERE eda.tenant_id = $1 AND eda.is_active = true
             AND ($2::uuid IS NULL OR eda.branch_id = $2)
             AND ($3::uuid IS NULL OR eda.department_id = $3)
          ORDER BY 3 NULLS LAST';

  RETURN QUERY EXECUTE sql USING p_tenant_id, p_branch_id, p_department_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_employee_assignments(uuid, uuid, uuid) TO authenticated;