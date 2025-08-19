-- Fix Critical RLS Security Issues for existing tables

-- Enable RLS on master_reference_data (the target table from migration)
ALTER TABLE master_reference_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_reference_data
CREATE POLICY "Allow authenticated users to read master reference data" 
ON master_reference_data FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage master reference data" 
ON master_reference_data FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Enable RLS on critical tables that don't have it
ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_employee_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for allocation_rules
CREATE POLICY "Tenant users can access their allocation rules" 
ON allocation_rules FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id::text = allocation_rules.tenant_id::text OR role = 'system_admin'::app_role)
));

-- Create policies for audit_trail
CREATE POLICY "System admins can access audit trail" 
ON audit_trail FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- Create policies for commission_earnings
CREATE POLICY "Tenant users can access their commission earnings" 
ON commission_earnings FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id::text = commission_earnings.tenant_id::text OR role = 'system_admin'::app_role)
));

-- Create policies for tenants
CREATE POLICY "System admins can manage tenants" 
ON tenants FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

CREATE POLICY "Tenant admins can view their tenant" 
ON tenants FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND (tenant_id = tenants.tenant_id OR role = 'system_admin'::app_role)
));