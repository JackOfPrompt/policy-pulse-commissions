-- Create Policy table with core fields
CREATE TABLE public.policies_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_number TEXT NOT NULL UNIQUE,
  insurer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  line_of_business TEXT NOT NULL CHECK (line_of_business IN ('Motor', 'Life', 'Health', 'Commercial')),
  policy_start_date DATE NOT NULL,
  policy_end_date DATE NOT NULL,
  policy_mode TEXT CHECK (policy_mode IN ('Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Single', 'Multi-year')),
  premium_amount NUMERIC NOT NULL,
  sum_assured NUMERIC,
  policy_type TEXT CHECK (policy_type IN ('New', 'Renewal', 'Roll-over', 'Ported')),
  policy_source TEXT CHECK (policy_source IN ('Online', 'Offline')),
  agent_id UUID,
  employee_id UUID,
  branch_id UUID,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Cancelled', 'Expired', 'Lapsed', 'Renewed', 'Pending')),
  uploaded_document TEXT,
  remarks TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MotorPolicy table (1:1 with Policy)
CREATE TABLE public.motor_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL UNIQUE,
  vehicle_type TEXT CHECK (vehicle_type IN ('Car', 'Bike', 'Commercial Vehicle', 'Tractor', 'EV')),
  registration_number TEXT,
  fuel_type TEXT CHECK (fuel_type IN ('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid')),
  manufacturer TEXT,
  model TEXT,
  variant TEXT,
  cubic_capacity INTEGER,
  chassis_number TEXT,
  engine_number TEXT,
  vehicle_age INTEGER,
  idv NUMERIC,
  ncb_percent INTEGER,
  own_damage_premium NUMERIC,
  third_party_premium NUMERIC,
  add_on_covers TEXT[], -- Array for multi-select options
  previous_policy_number TEXT,
  previous_insurer TEXT,
  is_break_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create LifePolicy table (1:1 with Policy)
CREATE TABLE public.life_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL UNIQUE,
  proposer_name TEXT,
  life_assured_name TEXT,
  relationship TEXT CHECK (relationship IN ('Self', 'Spouse', 'Child', 'Parent', 'Other')),
  sum_assured NUMERIC,
  policy_term INTEGER,
  premium_paying_term INTEGER,
  payment_frequency TEXT CHECK (payment_frequency IN ('Annual', 'Half-Yearly', 'Quarterly', 'Monthly', 'Single')),
  plan_type TEXT CHECK (plan_type IN ('Term', 'Endowment', 'Money Back', 'ULIP', 'Whole Life')),
  policy_mode TEXT CHECK (policy_mode IN ('Regular', 'Limited', 'Single Pay')),
  rider_options TEXT[], -- Array for multi-select options
  nominee_name TEXT,
  nominee_relation TEXT,
  medical_required BOOLEAN DEFAULT false,
  underwriting_status TEXT CHECK (underwriting_status IN ('Normal', 'Extra Premium', 'Declined', 'Postponed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HealthPolicy table (1:1 with Policy)
CREATE TABLE public.health_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL UNIQUE,
  proposer_name TEXT,
  floater_or_individual TEXT CHECK (floater_or_individual IN ('Floater', 'Individual')),
  insured_persons JSONB, -- Store array of objects with name, age, gender, relation
  sum_insured NUMERIC,
  deductible NUMERIC,
  policy_term INTEGER,
  payment_mode TEXT CHECK (payment_mode IN ('Annual', 'Quarterly', 'Monthly')),
  pre_existing_diseases TEXT[], -- Array for multi-select options
  portability BOOLEAN DEFAULT false,
  wellness_benefits TEXT[], -- Array for multi-select options
  opd_cover BOOLEAN DEFAULT false,
  room_rent_limit TEXT,
  critical_illness_cover BOOLEAN DEFAULT false,
  claim_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CommercialPolicy table (1:1 with Policy)
CREATE TABLE public.commercial_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL UNIQUE,
  policy_category TEXT CHECK (policy_category IN ('Fire', 'Marine', 'Engineering', 'Property', 'Liability', 'Cyber', 'Others')),
  sum_insured NUMERIC,
  risk_address TEXT,
  coverage_type TEXT,
  building_type TEXT,
  business_type TEXT,
  number_of_employees INTEGER,
  machinery_details TEXT,
  fire_safety_equipment BOOLEAN DEFAULT false,
  risk_inspection_done BOOLEAN DEFAULT false,
  proposer_details JSONB, -- Store object with companyName, PAN, GSTIN, contact
  claims_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.motor_policies 
ADD CONSTRAINT fk_motor_policy_id 
FOREIGN KEY (policy_id) REFERENCES public.policies_new(id) ON DELETE CASCADE;

ALTER TABLE public.life_policies 
ADD CONSTRAINT fk_life_policy_id 
FOREIGN KEY (policy_id) REFERENCES public.policies_new(id) ON DELETE CASCADE;

ALTER TABLE public.health_policies 
ADD CONSTRAINT fk_health_policy_id 
FOREIGN KEY (policy_id) REFERENCES public.policies_new(id) ON DELETE CASCADE;

ALTER TABLE public.commercial_policies 
ADD CONSTRAINT fk_commercial_policy_id 
FOREIGN KEY (policy_id) REFERENCES public.policies_new(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_policies_new_insurer_id ON public.policies_new(insurer_id);
CREATE INDEX idx_policies_new_product_id ON public.policies_new(product_id);
CREATE INDEX idx_policies_new_agent_id ON public.policies_new(agent_id);
CREATE INDEX idx_policies_new_employee_id ON public.policies_new(employee_id);
CREATE INDEX idx_policies_new_branch_id ON public.policies_new(branch_id);
CREATE INDEX idx_policies_new_line_of_business ON public.policies_new(line_of_business);
CREATE INDEX idx_policies_new_status ON public.policies_new(status);
CREATE INDEX idx_policies_new_policy_start_date ON public.policies_new(policy_start_date);
CREATE INDEX idx_policies_new_policy_end_date ON public.policies_new(policy_end_date);

-- Create updated_at trigger for policies_new
CREATE TRIGGER update_policies_new_updated_at
BEFORE UPDATE ON public.policies_new
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at triggers for related tables
CREATE TRIGGER update_motor_policies_updated_at
BEFORE UPDATE ON public.motor_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_life_policies_updated_at
BEFORE UPDATE ON public.life_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_policies_updated_at
BEFORE UPDATE ON public.health_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commercial_policies_updated_at
BEFORE UPDATE ON public.commercial_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.policies_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins
CREATE POLICY "Admins can manage all policies_new" 
ON public.policies_new 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all motor_policies" 
ON public.motor_policies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all life_policies" 
ON public.life_policies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all health_policies" 
ON public.health_policies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all commercial_policies" 
ON public.commercial_policies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a view for complete policy details
CREATE VIEW public.policies_with_details AS
SELECT 
  p.*,
  ip.provider_name as insurer_name,
  pr.name as product_name,
  a.name as agent_name,
  e.name as employee_name,
  b.name as branch_name
FROM public.policies_new p
LEFT JOIN public.insurance_providers ip ON p.insurer_id = ip.id
LEFT JOIN public.insurance_products pr ON p.product_id = pr.id
LEFT JOIN public.agents a ON p.agent_id = a.id
LEFT JOIN public.employees e ON p.employee_id = e.id
LEFT JOIN public.branches b ON p.branch_id = b.id;