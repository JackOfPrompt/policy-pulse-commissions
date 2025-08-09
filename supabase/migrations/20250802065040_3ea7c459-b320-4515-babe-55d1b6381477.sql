-- Update existing data to UPPERCASE for consistency
-- Insurance Providers
UPDATE insurance_providers
SET 
  provider_name = UPPER(provider_name),
  irdai_code = UPPER(COALESCE(irdai_code, ''));

-- Insurance Products  
UPDATE insurance_products
SET 
  name = UPPER(name),
  code = UPPER(code),
  category = UPPER(category),
  product_type = UPPER(COALESCE(product_type, '')),
  coverage_type = UPPER(coverage_type),
  premium_type = UPPER(premium_type);

-- Line of Business
UPDATE line_of_business
SET 
  name = UPPER(name),
  code = UPPER(COALESCE(code, ''));

-- Agents
UPDATE agents
SET 
  agent_type = UPPER(COALESCE(agent_type, '')),
  status = UPPER(status);

-- Employees  
UPDATE employees
SET 
  role = UPPER(role),
  status = UPPER(status);

-- Branches
UPDATE branches
SET 
  status = UPPER(status);

-- Leads
UPDATE leads
SET 
  line_of_business = UPPER(line_of_business),
  priority = UPPER(priority);

-- Policies (if they exist)
UPDATE policies_new
SET 
  line_of_business = UPPER(COALESCE(line_of_business, '')),
  policy_status = UPPER(COALESCE(policy_status::text, ''))
WHERE line_of_business IS NOT NULL OR policy_status IS NOT NULL;

-- Commission Rules
UPDATE commission_rules
SET 
  line_of_business = UPPER(line_of_business),
  rule_type = UPPER(rule_type);

-- Master Data Tables
UPDATE master_addons
SET 
  line_of_business = UPPER(line_of_business),
  addon_name = UPPER(addon_name),
  addon_type = UPPER(COALESCE(addon_type, ''));

UPDATE master_benefits
SET 
  line_of_business = UPPER(line_of_business),
  benefit_name = UPPER(benefit_name),
  benefit_type = UPPER(COALESCE(benefit_type, ''));

-- Create function to enforce uppercase on key fields
CREATE OR REPLACE FUNCTION enforce_uppercase_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different tables
  IF TG_TABLE_NAME = 'insurance_providers' THEN
    NEW.provider_name := UPPER(NEW.provider_name);
    NEW.irdai_code := UPPER(COALESCE(NEW.irdai_code, ''));
    
  ELSIF TG_TABLE_NAME = 'insurance_products' THEN
    NEW.name := UPPER(NEW.name);
    NEW.code := UPPER(NEW.code);
    NEW.category := UPPER(NEW.category);
    NEW.product_type := UPPER(COALESCE(NEW.product_type, ''));
    NEW.coverage_type := UPPER(NEW.coverage_type);
    NEW.premium_type := UPPER(NEW.premium_type);
    
  ELSIF TG_TABLE_NAME = 'line_of_business' THEN
    NEW.name := UPPER(NEW.name);
    NEW.code := UPPER(COALESCE(NEW.code, ''));
    
  ELSIF TG_TABLE_NAME = 'agents' THEN
    NEW.agent_type := UPPER(COALESCE(NEW.agent_type, ''));
    NEW.status := UPPER(NEW.status);
    
  ELSIF TG_TABLE_NAME = 'employees' THEN
    NEW.role := UPPER(NEW.role);
    NEW.status := UPPER(NEW.status);
    
  ELSIF TG_TABLE_NAME = 'branches' THEN
    NEW.status := UPPER(NEW.status);
    
  ELSIF TG_TABLE_NAME = 'leads' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.priority := UPPER(NEW.priority);
    
  ELSIF TG_TABLE_NAME = 'policies_new' THEN
    NEW.line_of_business := UPPER(COALESCE(NEW.line_of_business, ''));
    
  ELSIF TG_TABLE_NAME = 'commission_rules' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.rule_type := UPPER(NEW.rule_type);
    
  ELSIF TG_TABLE_NAME = 'master_addons' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.addon_name := UPPER(NEW.addon_name);
    NEW.addon_type := UPPER(COALESCE(NEW.addon_type, ''));
    
  ELSIF TG_TABLE_NAME = 'master_benefits' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.benefit_name := UPPER(NEW.benefit_name);
    NEW.benefit_type := UPPER(COALESCE(NEW.benefit_type, ''));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all relevant tables
DROP TRIGGER IF EXISTS trg_uppercase_insurance_providers ON insurance_providers;
CREATE TRIGGER trg_uppercase_insurance_providers
BEFORE INSERT OR UPDATE ON insurance_providers
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_insurance_products ON insurance_products;
CREATE TRIGGER trg_uppercase_insurance_products
BEFORE INSERT OR UPDATE ON insurance_products
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_line_of_business ON line_of_business;
CREATE TRIGGER trg_uppercase_line_of_business
BEFORE INSERT OR UPDATE ON line_of_business
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_agents ON agents;
CREATE TRIGGER trg_uppercase_agents
BEFORE INSERT OR UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_employees ON employees;
CREATE TRIGGER trg_uppercase_employees
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_branches ON branches;
CREATE TRIGGER trg_uppercase_branches
BEFORE INSERT OR UPDATE ON branches
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_leads ON leads;
CREATE TRIGGER trg_uppercase_leads
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_policies_new ON policies_new;
CREATE TRIGGER trg_uppercase_policies_new
BEFORE INSERT OR UPDATE ON policies_new
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_commission_rules ON commission_rules;
CREATE TRIGGER trg_uppercase_commission_rules
BEFORE INSERT OR UPDATE ON commission_rules
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_master_addons ON master_addons;
CREATE TRIGGER trg_uppercase_master_addons
BEFORE INSERT OR UPDATE ON master_addons
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

DROP TRIGGER IF EXISTS trg_uppercase_master_benefits ON master_benefits;
CREATE TRIGGER trg_uppercase_master_benefits
BEFORE INSERT OR UPDATE ON master_benefits
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();