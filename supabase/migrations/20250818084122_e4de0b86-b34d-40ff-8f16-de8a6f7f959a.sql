-- First, create the tenant_organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS tenant_organizations (
    tenant_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_person VARCHAR(255),
    domain VARCHAR(255),
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table (referenced by branches)
CREATE TABLE IF NOT EXISTS employees (
    employee_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenant_organizations(tenant_id)
);

-- Create branches table
CREATE TABLE branches (
    branch_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id BIGINT NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    address TEXT,
    manager_id BIGINT, -- employee_id of branch manager
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenant_organizations(tenant_id),
    FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);

-- Create branch_departments mapping table
CREATE TABLE branch_departments (
    branch_dept_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    branch_id BIGINT NOT NULL,
    dept_id INTEGER NOT NULL, -- references master_departments.department_id
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (dept_id) REFERENCES master_departments(department_id),
    UNIQUE(branch_id, dept_id) -- prevent duplicate assignment
);

-- Add RLS policies for branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their branches" 
ON branches FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = branches.tenant_id OR role = 'system_admin'::app_role)
));

CREATE POLICY "Tenant admins can manage their branches" 
ON branches FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = branches.tenant_id OR role = 'system_admin'::app_role)
  AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
));

-- Add RLS policies for branch_departments
ALTER TABLE branch_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their branch departments" 
ON branch_departments FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM branches b
  JOIN profiles p ON (p.tenant_id = b.tenant_id OR p.role = 'system_admin'::app_role)
  WHERE b.branch_id = branch_departments.branch_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage their branch departments" 
ON branch_departments FOR ALL 
USING (EXISTS (
  SELECT 1 FROM branches b
  JOIN profiles p ON (p.tenant_id = b.tenant_id OR p.role = 'system_admin'::app_role)
  WHERE b.branch_id = branch_departments.branch_id 
  AND p.user_id = auth.uid()
  AND p.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
));

-- Add RLS policies for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their employees" 
ON employees FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = employees.tenant_id OR role = 'system_admin'::app_role)
));

CREATE POLICY "Tenant admins can manage their employees" 
ON employees FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = employees.tenant_id OR role = 'system_admin'::app_role)
  AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
));

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
CREATE INDEX IF NOT EXISTS idx_branch_departments_branch ON branch_departments(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_departments_dept ON branch_departments(dept_id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);