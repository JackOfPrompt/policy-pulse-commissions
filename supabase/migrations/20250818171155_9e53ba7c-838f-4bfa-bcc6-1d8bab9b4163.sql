-- Simplified RLS fixes - basic security only

-- Enable RLS on core auth tables
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic policies for auth tables
CREATE POLICY "Authenticated users can view permissions" 
ON permissions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view role permissions" 
ON role_permissions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view roles" 
ON roles FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view user roles" 
ON user_roles FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view users" 
ON users FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Basic policies for data tables
CREATE POLICY "Authenticated users can view products" 
ON products FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view settlements" 
ON settlements FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view variances" 
ON variances FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view workflow tasks" 
ON workflow_tasks FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view employee salaries" 
ON tenant_employee_salaries FOR SELECT 
USING (auth.uid() IS NOT NULL);