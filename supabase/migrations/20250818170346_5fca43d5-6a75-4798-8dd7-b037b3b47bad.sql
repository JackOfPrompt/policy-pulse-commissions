-- Complete RLS fixes for remaining tables

-- Check remaining tables without RLS and add policies for key ones
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for permissions
CREATE POLICY "System admins can manage permissions" 
ON permissions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Create policies for role_permissions
CREATE POLICY "System admins can manage role permissions" 
ON role_permissions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Create policies for roles
CREATE POLICY "System admins can manage roles" 
ON roles FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Create policies for user_roles
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

-- Create policies for users table
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

-- Add policies for remaining tables that need them
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

CREATE POLICY "Tenant users can access settlements" 
ON settlements FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id::text = settlements.tenant_id::text OR role = 'system_admin'::app_role)
));

CREATE POLICY "Tenant users can access variances" 
ON variances FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id::text = variances.tenant_id::text OR role = 'system_admin'::app_role)
));

CREATE POLICY "Tenant users can access workflow tasks" 
ON workflow_tasks FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = workflow_tasks.tenant_id OR role = 'system_admin'::app_role)
));

CREATE POLICY "Tenant users can access employee salaries" 
ON tenant_employee_salaries FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = tenant_employee_salaries.tenant_id OR role = 'system_admin'::app_role)
));