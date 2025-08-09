-- Enable RLS on critical tables for dashboard functionality
ALTER TABLE policies_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create comprehensive admin policies for dashboard access
CREATE POLICY "Admin can view all policies for dashboard" 
ON policies_new FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE POLICY "Admin can view all leads for dashboard" 
ON leads FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE POLICY "Admin can view all tasks for dashboard" 
ON tasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Allow admin to manage policies_new
CREATE POLICY "Admin can manage policies_new" 
ON policies_new FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Allow admin to manage leads  
CREATE POLICY "Admin can manage leads" 
ON leads FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Allow admin to manage tasks
CREATE POLICY "Admin can manage tasks" 
ON tasks FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));