-- Create function to enforce uppercase on key fields (excluding check constraints)
CREATE OR REPLACE FUNCTION enforce_uppercase_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different tables
  IF TG_TABLE_NAME = 'insurance_providers' THEN
    NEW.provider_name := UPPER(NEW.provider_name);
    NEW.irdai_code := CASE 
      WHEN NEW.irdai_code IS NULL OR NEW.irdai_code = '' THEN NULL
      ELSE UPPER(NEW.irdai_code)
    END;
    
  ELSIF TG_TABLE_NAME = 'insurance_products' THEN
    NEW.name := UPPER(NEW.name);
    NEW.code := UPPER(NEW.code);
    NEW.category := UPPER(NEW.category);
    NEW.product_type := CASE 
      WHEN NEW.product_type IS NULL OR NEW.product_type = '' THEN NULL
      ELSE UPPER(NEW.product_type)
    END;
    NEW.premium_type := UPPER(NEW.premium_type);
    -- Don't change coverage_type as it has check constraints
    
  ELSIF TG_TABLE_NAME = 'line_of_business' THEN
    NEW.name := UPPER(NEW.name);
    NEW.code := CASE 
      WHEN NEW.code IS NULL OR NEW.code = '' THEN NULL
      ELSE UPPER(NEW.code)
    END;
    
  ELSIF TG_TABLE_NAME = 'agents' THEN
    NEW.agent_type := CASE 
      WHEN NEW.agent_type IS NULL OR NEW.agent_type = '' THEN NULL
      ELSE UPPER(NEW.agent_type)
    END;
    NEW.status := UPPER(NEW.status);
    
  ELSIF TG_TABLE_NAME = 'employees' THEN
    NEW.role := UPPER(NEW.role);
    NEW.status := UPPER(NEW.status);
    
  ELSIF TG_TABLE_NAME = 'branches' THEN
    NEW.status := UPPER(NEW.status);
    
  ELSIF TG_TABLE_NAME = 'leads' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.priority := UPPER(NEW.priority);
    
  ELSIF TG_TABLE_NAME = 'commission_rules' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.rule_type := UPPER(NEW.rule_type);
    
  ELSIF TG_TABLE_NAME = 'master_addons' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.addon_name := UPPER(NEW.addon_name);
    NEW.addon_type := CASE 
      WHEN NEW.addon_type IS NULL OR NEW.addon_type = '' THEN NULL
      ELSE UPPER(NEW.addon_type)
    END;
    
  ELSIF TG_TABLE_NAME = 'master_benefits' THEN
    NEW.line_of_business := UPPER(NEW.line_of_business);
    NEW.benefit_name := UPPER(NEW.benefit_name);
    NEW.benefit_type := CASE 
      WHEN NEW.benefit_type IS NULL OR NEW.benefit_type = '' THEN NULL
      ELSE UPPER(NEW.benefit_type)
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all relevant tables
CREATE TRIGGER trg_uppercase_insurance_providers
BEFORE INSERT OR UPDATE ON insurance_providers
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_insurance_products
BEFORE INSERT OR UPDATE ON insurance_products
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_line_of_business
BEFORE INSERT OR UPDATE ON line_of_business
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_agents
BEFORE INSERT OR UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_employees
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_branches
BEFORE INSERT OR UPDATE ON branches
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_leads
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_commission_rules
BEFORE INSERT OR UPDATE ON commission_rules
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_master_addons
BEFORE INSERT OR UPDATE ON master_addons
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();

CREATE TRIGGER trg_uppercase_master_benefits
BEFORE INSERT OR UPDATE ON master_benefits
FOR EACH ROW
EXECUTE FUNCTION enforce_uppercase_fields();