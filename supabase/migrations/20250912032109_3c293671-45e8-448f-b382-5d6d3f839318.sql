-- Create organizations table first (if not exists)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
    employees INTEGER DEFAULT 0,
    agents INTEGER DEFAULT 0,
    customers INTEGER DEFAULT 0,
    founded DATE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create employees table (if not exists)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create agent plans reference table
CREATE TABLE public.agent_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    features JSONB,
    commission_percentage NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create qualifications reference table
CREATE TABLE public.qualifications (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Create main agents table
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    agent_type TEXT CHECK (agent_type IN ('MISP','POSP')) NOT NULL,
    agent_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male','female','other')),
    dob DATE,
    qualification TEXT,
    reference TEXT,
    reference_id UUID,
    agent_plan_id UUID REFERENCES public.agent_plans(id) ON DELETE SET NULL,

    -- Contact Info
    phone TEXT,
    mobilepermissions BOOLEAN DEFAULT false,
    email TEXT,
    emailpermissions BOOLEAN DEFAULT false,
    address TEXT,
    landmark TEXT,
    district TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    pincode TEXT,

    -- Identity Documents
    pan_card TEXT,
    aadhar_card TEXT,
    pan_url TEXT,
    aadhar_url TEXT,
    degree_doc_url TEXT,
    cheque_doc_url TEXT,
    profile_doc_url TEXT,
    other_doc_url TEXT,

    -- Bank Details
    account_name TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    account_type TEXT CHECK (account_type IN ('savings','current')),
    branch_name TEXT,

    -- Business / Commission
    percentage NUMERIC(5,2),
    status TEXT CHECK (status IN ('active','inactive','suspended')) DEFAULT 'active',
    kyc_status TEXT CHECK (kyc_status IN ('approved','pending','rejected')) DEFAULT 'pending',

    -- Audit
    delete_flag BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_date TIMESTAMPTZ DEFAULT now(),
    updated_date TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Organizations are viewable by authenticated users" 
ON public.organizations FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create RLS policies for employees
CREATE POLICY "Employees are viewable by authenticated users" 
ON public.employees FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create RLS policies for users
CREATE POLICY "Users are viewable by authenticated users" 
ON public.users FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create RLS policies for agent_plans
CREATE POLICY "Agent plans are viewable by authenticated users" 
ON public.agent_plans FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create RLS policies for qualifications
CREATE POLICY "Qualifications are viewable by authenticated users" 
ON public.qualifications FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create RLS policies for agents
CREATE POLICY "Agents are viewable by authenticated users" 
ON public.agents FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Agents can be created by authenticated users" 
ON public.agents FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Agents can be updated by authenticated users" 
ON public.agents FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Insert sample data for agent plans
INSERT INTO public.agent_plans (name, description, features, commission_percentage) VALUES
('Basic MISP', 'Basic Motor Insurance Service Provider plan', '{"motor_insurance": true, "basic_support": true}', 2.50),
('Premium MISP', 'Premium Motor Insurance Service Provider plan', '{"motor_insurance": true, "health_insurance": true, "premium_support": true}', 3.00),
('Basic POSP', 'Basic Point of Sales Person plan', '{"life_insurance": true, "basic_support": true}', 2.00),
('Premium POSP', 'Premium Point of Sales Person plan', '{"life_insurance": true, "health_insurance": true, "motor_insurance": true, "premium_support": true}', 3.50);

-- Insert sample qualifications
INSERT INTO public.qualifications (name) VALUES
('Graduate'),
('Post Graduate'),
('Professional Degree'),
('Diploma'),
('12th Pass'),
('Insurance Certification');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample organizations
INSERT INTO public.organizations (name, type, status, address) VALUES
('Metro Insurance Group', 'Primary Insurer', 'active', '123 Business District, Mumbai, India'),
('Regional Coverage Ltd', 'Regional Partner', 'active', '456 Finance Street, Delhi, India'),
('SecureLife Insurance', 'Life Insurance Specialist', 'active', '789 Corporate Park, Bangalore, India');

-- Insert sample users
INSERT INTO public.users (email, role) VALUES
('admin@metroinsurance.com', 'admin'),
('employee@metroinsurance.com', 'employee'),
('agent@metroinsurance.com', 'agent');

-- Insert sample employees
INSERT INTO public.employees (org_id, employee_name, email, phone, role, status) 
SELECT 
    o.id,
    'John Employee',
    'employee@metroinsurance.com',
    '+91-9876543210',
    'manager',
    'active'
FROM public.organizations o 
WHERE o.name = 'Metro Insurance Group'
LIMIT 1;