-- Create roles table
CREATE TABLE public.roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL,
  role_code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  tenant_id INTEGER,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE public.permissions (
  permission_id SERIAL PRIMARY KEY,
  permission_name VARCHAR(100) NOT NULL,
  permission_code VARCHAR(50) NOT NULL UNIQUE,
  module VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  role_permission_id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES public.permissions(permission_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- Create user_roles table for assigning roles to users with scope
CREATE TABLE public.user_roles (
  user_role_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  role_id INTEGER NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL,
  branch_id INTEGER,
  department_id INTEGER,
  assigned_by UUID,
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample permissions
INSERT INTO public.permissions (permission_name, permission_code, module, description) VALUES
('View Dashboard', 'VIEW_DASHBOARD', 'Dashboard', 'Can view main dashboard'),
('Manage Users', 'MANAGE_USERS', 'Users', 'Can create, edit, and manage users'),
('Approve Policies', 'APPROVE_POLICIES', 'Policies', 'Can approve insurance policies'),
('Generate Reports', 'GENERATE_REPORTS', 'Reports', 'Can generate and download reports'),
('Manage Departments', 'MANAGE_DEPARTMENTS', 'Admin', 'Can manage departments'),
('Manage Branches', 'MANAGE_BRANCHES', 'Admin', 'Can manage branches'),
('View Claims', 'VIEW_CLAIMS', 'Claims', 'Can view insurance claims'),
('Process Claims', 'PROCESS_CLAIMS', 'Claims', 'Can process and update claims'),
('Manage Products', 'MANAGE_PRODUCTS', 'Products', 'Can manage insurance products'),
('View Analytics', 'VIEW_ANALYTICS', 'Analytics', 'Can view analytics and insights');

-- Insert sample roles
INSERT INTO public.roles (role_name, role_code, description, tenant_id, status) VALUES
('System Administrator', 'SYS_ADMIN', 'Full system access', NULL, 'Active'),
('Branch Manager', 'BRANCH_MGR', 'Manages branch operations', 1, 'Active'),
('Department Head', 'DEPT_HEAD', 'Manages department operations', 1, 'Active'),
('Agent', 'AGENT', 'Insurance agent role', 1, 'Active'),
('Employee', 'EMPLOYEE', 'General employee access', 1, 'Active');

-- Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
-- System Admin gets all permissions
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
-- Branch Manager
(2, 1), (2, 2), (2, 3), (2, 4), (2, 7), (2, 8), (2, 10),
-- Department Head  
(3, 1), (3, 2), (3, 4), (3, 7), (3, 10),
-- Agent
(4, 1), (4, 7), (4, 9),
-- Employee
(5, 1), (5, 7);

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read permissions (needed for role assignment)
CREATE POLICY "Allow authenticated users to read permissions" ON public.permissions
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read roles
CREATE POLICY "Allow authenticated users to read roles" ON public.roles
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read role permissions
CREATE POLICY "Allow authenticated users to read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read user roles
CREATE POLICY "Allow authenticated users to read user roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- System admins can manage all
CREATE POLICY "System admins can manage roles" ON public.roles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage permissions" ON public.permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage role permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();