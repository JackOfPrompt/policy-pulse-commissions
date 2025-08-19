-- Update the tenant_organizations table to use UUID (consistent with profiles table)
DROP TABLE IF EXISTS tenant_organizations CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS branch_departments CASCADE;

-- Create tenant_organizations table with UUID (matching profiles.tenant_id)
CREATE TABLE tenant_organizations (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create employees table
CREATE TABLE employees (
    employee_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id UUID NOT NULL,
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
    tenant_id UUID NOT NULL,
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

-- Add RLS policies
ALTER TABLE tenant_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Tenant organizations policies
CREATE POLICY "Users can view their tenant organization" 
ON tenant_organizations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = tenant_organizations.tenant_id OR role = 'system_admin'::app_role)
));

CREATE POLICY "Tenant admins can manage their organization" 
ON tenant_organizations FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = tenant_organizations.tenant_id OR role = 'system_admin'::app_role)
  AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
));

-- Branches policies
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

-- Branch departments policies
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

-- Employees policies
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

-- Add indexes
CREATE INDEX idx_tenant_organizations_status ON tenant_organizations(status);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_branches_status ON branches(status);
CREATE INDEX idx_branch_departments_branch ON branch_departments(branch_id);
CREATE INDEX idx_branch_departments_dept ON branch_departments(dept_id);
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_status ON employees(status);