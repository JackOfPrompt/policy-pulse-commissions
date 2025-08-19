-- Create missing master_departments table that's referenced throughout the application
CREATE TABLE IF NOT EXISTS public.master_departments (
  department_id SERIAL PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL,
  department_code VARCHAR(50) NOT NULL UNIQUE,
  tenant_id UUID,
  branch_id BIGINT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.master_departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_departments
CREATE POLICY "System admins can manage departments" ON public.master_departments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);

CREATE POLICY "Tenant users can view their departments" ON public.master_departments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (tenant_id = master_departments.tenant_id OR role = 'system_admin')
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_master_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_master_departments_updated_at
    BEFORE UPDATE ON public.master_departments
    FOR EACH ROW
    EXECUTE FUNCTION update_master_departments_updated_at();

-- Insert sample departments to fix empty table warnings
INSERT INTO public.master_departments (department_name, department_code, description, status) VALUES
('Sales & Marketing', 'SALES', 'Handles sales operations and marketing activities', 'Active'),
('Operations', 'OPS', 'Manages day-to-day operational activities', 'Active'),
('Customer Service', 'CS', 'Handles customer support and service', 'Active'),
('Information Technology', 'IT', 'Manages IT infrastructure and development', 'Active'),
('Human Resources', 'HR', 'Handles employee relations and recruitment', 'Active'),
('Finance & Accounting', 'FIN', 'Manages financial operations and accounting', 'Active'),
('Claims Processing', 'CLAIMS', 'Handles insurance claims processing', 'Active'),
('Underwriting', 'UW', 'Risk assessment and policy underwriting', 'Active'),
('Compliance & Risk', 'COMP', 'Ensures regulatory compliance and risk management', 'Active'),
('Training & Development', 'TRAIN', 'Employee training and development programs', 'Active');