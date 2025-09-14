-- Enable RLS on existing tables that were missing it
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE misps ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for existing tables
CREATE POLICY "Users can view their organization's agents" 
ON agents FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's agents" 
ON agents FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's branches" 
ON branches FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's branches" 
ON branches FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's employees" 
ON employees FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's employees" 
ON employees FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's misps" 
ON misps FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's misps" 
ON misps FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view organizations they belong to" 
ON organizations FOR SELECT 
USING (id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can manage all organizations" 
ON organizations FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_organizations WHERE role = 'superadmin'));

CREATE POLICY "Users can view their organization memberships" 
ON user_organizations FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage user organizations" 
ON user_organizations FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_organizations WHERE role = 'superadmin'));