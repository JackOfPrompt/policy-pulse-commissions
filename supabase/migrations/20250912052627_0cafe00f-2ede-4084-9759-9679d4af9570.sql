-- Create product_types table to store insurance product configurations
CREATE TABLE public.product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  subtypes jsonb,
  fields jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, code)
);

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_code text,
  customer_type text CHECK (customer_type IN ('individual', 'corporate')) DEFAULT 'individual',
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  date_of_birth date,
  gender text,
  address text,
  city text,
  state text,
  pincode text,
  pan_number text,
  aadhar_number text,
  gstin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE(org_id, customer_code)
);

-- Create vehicles table for motor insurance
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  registration_number text,
  make text,
  model text,
  variant text,
  fuel_type text,
  cc int,
  engine_number text,
  chassis_number text,
  manufacture_date date,
  registration_date date,
  body_type text,
  permit_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create main policies table
CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id),
  agent_id uuid REFERENCES agents(id),
  employee_id uuid REFERENCES employees(id),
  
  product_type_id uuid NOT NULL REFERENCES product_types(id),
  policy_number text NOT NULL,
  plan_name text,
  provider text,
  policy_status text CHECK (policy_status IN ('active','lapsed','expired','cancelled')) DEFAULT 'active',

  start_date date,
  end_date date,
  issue_date date,
  
  premium_without_gst numeric,
  gst numeric,
  premium_with_gst numeric,
  
  dynamic_details jsonb, -- Holds product-specific fields for flexibility

  pdf_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  
  UNIQUE(org_id, policy_number)
);

-- Create life policy details table
CREATE TABLE public.life_policy_details (
  policy_id uuid PRIMARY KEY REFERENCES policies(id) ON DELETE CASCADE,
  policy_term int,
  premium_payment_term int,
  premium_frequency text,
  maturity_date date,
  sum_assured numeric,
  uin text,
  plan_type text,
  benefits jsonb,
  tax_benefits text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create health policy details table
CREATE TABLE public.health_policy_details (
  policy_id uuid PRIMARY KEY REFERENCES policies(id) ON DELETE CASCADE,
  cover_type text,
  uin text,
  policy_type text,
  benefits jsonb,
  exclusions jsonb,
  waiting_period int,
  co_pay numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create insured members table for health policies
CREATE TABLE public.insured_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES health_policy_details(policy_id) ON DELETE CASCADE,
  name text NOT NULL,
  dob date,
  gender text,
  relationship text,
  pre_existing_diseases text,
  member_id text,
  sum_insured numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create motor policy details table
CREATE TABLE public.motor_policy_details (
  policy_id uuid PRIMARY KEY REFERENCES policies(id) ON DELETE CASCADE,
  policy_type text,
  policy_sub_type text,
  idv numeric,
  ncb numeric,
  previous_claim boolean DEFAULT false,
  previous_insurer_name text,
  previous_policy_number text,
  vehicle_id uuid REFERENCES vehicles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_policies_org_id ON policies(org_id);
CREATE INDEX idx_policies_customer_id ON policies(customer_id);
CREATE INDEX idx_policies_agent_id ON policies(agent_id);
CREATE INDEX idx_policies_product_type_id ON policies(product_type_id);
CREATE INDEX idx_policies_status ON policies(policy_status);
CREATE INDEX idx_policies_dynamic_details ON policies USING GIN(dynamic_details);

CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);

CREATE INDEX idx_insured_members_policy_id ON insured_members(policy_id);

-- Enable RLS on all tables
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_policy_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_policy_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE insured_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_policy_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization-based access
CREATE POLICY "Users can view their organization's product types" 
ON product_types FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's product types" 
ON product_types FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's customers" 
ON customers FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's customers" 
ON customers FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's vehicles" 
ON vehicles FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's vehicles" 
ON vehicles FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's policies" 
ON policies FOR SELECT 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's policies" 
ON policies FOR ALL 
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view life policy details for their organization" 
ON life_policy_details FOR SELECT 
USING (policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage life policy details for their organization" 
ON life_policy_details FOR ALL 
USING (policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can view health policy details for their organization" 
ON health_policy_details FOR SELECT 
USING (policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage health policy details for their organization" 
ON health_policy_details FOR ALL 
USING (policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can view insured members for their organization" 
ON insured_members FOR SELECT 
USING (policy_id IN (SELECT policy_id FROM health_policy_details WHERE policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))));

CREATE POLICY "Users can manage insured members for their organization" 
ON insured_members FOR ALL 
USING (policy_id IN (SELECT policy_id FROM health_policy_details WHERE policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))));

CREATE POLICY "Users can view motor policy details for their organization" 
ON motor_policy_details FOR SELECT 
USING (policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage motor policy details for their organization" 
ON motor_policy_details FOR ALL 
USING (policy_id IN (SELECT id FROM policies WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

-- Create triggers for updating timestamps
CREATE TRIGGER update_product_types_updated_at
BEFORE UPDATE ON product_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
BEFORE UPDATE ON policies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_life_policy_details_updated_at
BEFORE UPDATE ON life_policy_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_policy_details_updated_at
BEFORE UPDATE ON health_policy_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insured_members_updated_at
BEFORE UPDATE ON insured_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motor_policy_details_updated_at
BEFORE UPDATE ON motor_policy_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();