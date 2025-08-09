-- Disable RLS for policy dependent tables
ALTER TABLE public.policies_new DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewal_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions DISABLE ROW LEVEL SECURITY;

-- Update existing policies status to 'Issued' (checking what status values currently exist)
UPDATE public.policies_new 
SET status = 'Issued', 
    policy_status = 'Issued'
WHERE status != 'Issued' OR policy_status != 'Issued';

-- Update existing data to UPPERCASE for policies_new table
UPDATE public.policies_new
SET 
  line_of_business = UPPER(line_of_business),
  policy_type = UPPER(policy_type),
  policy_source = UPPER(policy_source),
  created_by_type = UPPER(created_by_type),
  payment_mode = UPPER(payment_mode),
  status = UPPER(status),
  policy_status = UPPER(policy_status);

-- Update existing data to UPPERCASE for insurance_providers table
UPDATE public.insurance_providers
SET 
  provider_name = UPPER(provider_name),
  status = UPPER(status);

-- Update existing data to UPPERCASE for insurance_products table
UPDATE public.insurance_products
SET 
  name = UPPER(name),
  category = UPPER(category),
  coverage_type = UPPER(coverage_type),
  premium_type = UPPER(premium_type),
  status = UPPER(status),
  product_type = UPPER(product_type);

-- Update existing data to UPPERCASE for motor_vehicle_types table
UPDATE public.motor_vehicle_types
SET 
  name = UPPER(name),
  category = UPPER(category);

-- Update existing data to UPPERCASE for line_of_business table
UPDATE public.line_of_business
SET 
  name = UPPER(name);

-- Update existing data to UPPERCASE for agents table
UPDATE public.agents
SET 
  agent_type = UPPER(agent_type),
  status = UPPER(status);

-- Update existing data to UPPERCASE for employees table
UPDATE public.employees
SET 
  role = UPPER(role),
  status = UPPER(status);

-- Update existing data to UPPERCASE for branches table
UPDATE public.branches
SET 
  status = UPPER(status);

-- Create function to enforce UPPERCASE fields
CREATE OR REPLACE FUNCTION enforce_uppercase_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- For policies_new table
  IF TG_TABLE_NAME = 'policies_new' THEN
    IF NEW.line_of_business IS NOT NULL THEN
      NEW.line_of_business := UPPER(NEW.line_of_business);
    END IF;
    IF NEW.policy_type IS NOT NULL THEN
      NEW.policy_type := UPPER(NEW.policy_type);
    END IF;
    IF NEW.policy_source IS NOT NULL THEN
      NEW.policy_source := UPPER(NEW.policy_source);
    END IF;
    IF NEW.created_by_type IS NOT NULL THEN
      NEW.created_by_type := UPPER(NEW.created_by_type);
    END IF;
    IF NEW.payment_mode IS NOT NULL THEN
      NEW.payment_mode := UPPER(NEW.payment_mode);
    END IF;
    IF NEW.status IS NOT NULL THEN
      NEW.status := UPPER(NEW.status);
    END IF;
    IF NEW.policy_status IS NOT NULL THEN
      NEW.policy_status := UPPER(NEW.policy_status);
    END IF;
  END IF;

  -- For insurance_providers table
  IF TG_TABLE_NAME = 'insurance_providers' THEN
    IF NEW.provider_name IS NOT NULL THEN
      NEW.provider_name := UPPER(NEW.provider_name);
    END IF;
    IF NEW.status IS NOT NULL THEN
      NEW.status := UPPER(NEW.status);
    END IF;
  END IF;

  -- For insurance_products table
  IF TG_TABLE_NAME = 'insurance_products' THEN
    IF NEW.name IS NOT NULL THEN
      NEW.name := UPPER(NEW.name);
    END IF;
    IF NEW.category IS NOT NULL THEN
      NEW.category := UPPER(NEW.category);
    END IF;
    IF NEW.coverage_type IS NOT NULL THEN
      NEW.coverage_type := UPPER(NEW.coverage_type);
    END IF;
    IF NEW.premium_type IS NOT NULL THEN
      NEW.premium_type := UPPER(NEW.premium_type);
    END IF;
    IF NEW.status IS NOT NULL THEN
      NEW.status := UPPER(NEW.status);
    END IF;
    IF NEW.product_type IS NOT NULL THEN
      NEW.product_type := UPPER(NEW.product_type);
    END IF;
  END IF;

  -- For motor_vehicle_types table
  IF TG_TABLE_NAME = 'motor_vehicle_types' THEN
    IF NEW.name IS NOT NULL THEN
      NEW.name := UPPER(NEW.name);
    END IF;
    IF NEW.category IS NOT NULL THEN
      NEW.category := UPPER(NEW.category);
    END IF;
  END IF;

  -- For line_of_business table
  IF TG_TABLE_NAME = 'line_of_business' THEN
    IF NEW.name IS NOT NULL THEN
      NEW.name := UPPER(NEW.name);
    END IF;
  END IF;

  -- For agents table
  IF TG_TABLE_NAME = 'agents' THEN
    IF NEW.agent_type IS NOT NULL THEN
      NEW.agent_type := UPPER(NEW.agent_type);
    END IF;
    IF NEW.status IS NOT NULL THEN
      NEW.status := UPPER(NEW.status);
    END IF;
  END IF;

  -- For employees table
  IF TG_TABLE_NAME = 'employees' THEN
    IF NEW.role IS NOT NULL THEN
      NEW.role := UPPER(NEW.role);
    END IF;
    IF NEW.status IS NOT NULL THEN
      NEW.status := UPPER(NEW.status);
    END IF;
  END IF;

  -- For branches table
  IF TG_TABLE_NAME = 'branches' THEN
    IF NEW.status IS NOT NULL THEN
      NEW.status := UPPER(NEW.status);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all relevant tables
CREATE TRIGGER trg_uppercase_policies_new
BEFORE INSERT OR UPDATE ON public.policies_new
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_insurance_providers
BEFORE INSERT OR UPDATE ON public.insurance_providers
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_insurance_products
BEFORE INSERT OR UPDATE ON public.insurance_products
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_motor_vehicle_types
BEFORE INSERT OR UPDATE ON public.motor_vehicle_types
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_line_of_business
BEFORE INSERT OR UPDATE ON public.line_of_business
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_agents
BEFORE INSERT OR UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_employees
BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_branches
BEFORE INSERT OR UPDATE ON public.branches
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();