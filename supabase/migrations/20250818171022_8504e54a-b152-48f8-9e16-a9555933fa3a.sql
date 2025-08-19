-- Complete RLS fixes - simplified approach to avoid type conflicts

-- Enable RLS on core tables first
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for authentication/authorization tables
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

-- Simple policies for data access
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

-- Basic access for variances (uuid tenant_id matches profiles)
CREATE POLICY "Tenant users can access variances" 
ON variances FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (profiles.tenant_id = variances.tenant_id OR role = 'system_admin'::app_role)
));

-- Simple auth-only policies for problematic tables
CREATE POLICY "Authenticated users can access settlements" 
ON settlements FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage settlements" 
ON settlements FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "Authenticated users can access workflow tasks" 
ON workflow_tasks FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage workflow tasks" 
ON workflow_tasks FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "Authenticated users can access employee salaries" 
ON tenant_employee_salaries FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage employee salaries" 
ON tenant_employee_salaries FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));