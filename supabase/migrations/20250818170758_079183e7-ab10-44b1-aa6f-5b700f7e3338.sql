-- Complete RLS fixes with correct type handling

-- Enable RLS on remaining tables (skip if already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'permissions' AND rowsecurity = true) THEN
        ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'role_permissions' AND rowsecurity = true) THEN
        ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles' AND rowsecurity = true) THEN
        ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND rowsecurity = true) THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND rowsecurity = true) THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for core tables
CREATE POLICY "System admins can manage permissions" 
ON permissions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "System admins can manage role permissions" 
ON role_permissions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "System admins can manage roles" 
ON roles FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "System admins can manage user roles" 
ON user_roles FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "Users can view their own roles" 
ON user_roles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System admins can manage users" 
ON users FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "Users can view their own record" 
ON users FOR SELECT 
USING (user_id = auth.uid());

-- Policies for data tables with correct type handling
CREATE POLICY "Tenant users can access products" 
ON products FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage products" 
ON products FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- settlements has bigint tenant_id
CREATE POLICY "Tenant users can access settlements" 
ON settlements FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND ((profiles.tenant_id)::text = (settlements.tenant_id)::text OR role = 'system_admin'::app_role)
));

-- variances has uuid tenant_id 
CREATE POLICY "Tenant users can access variances" 
ON variances FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (profiles.tenant_id = variances.tenant_id OR role = 'system_admin'::app_role)
));

-- Simple policies for remaining tables
CREATE POLICY "Authenticated users can access workflow tasks" 
ON workflow_tasks FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access employee salaries" 
ON tenant_employee_salaries FOR ALL 
USING (auth.uid() IS NOT NULL);