-- Update the trigger function to exclude fields with check constraints
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
    -- Don't change coverage_type or premium_type as they have check constraints
    
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

-- Now update existing data (excluding insurance_products initially)
-- Insurance Providers
UPDATE insurance_providers
SET 
  provider_name = UPPER(provider_name),
  irdai_code = CASE 
    WHEN irdai_code IS NULL OR irdai_code = '' THEN NULL
    ELSE UPPER(irdai_code)
  END;

-- Line of Business
UPDATE line_of_business
SET 
  name = UPPER(name),
  code = CASE 
    WHEN code IS NULL OR code = '' THEN NULL
    ELSE UPPER(code)
  END;

-- Agents
UPDATE agents
SET 
  agent_type = CASE 
    WHEN agent_type IS NULL OR agent_type = '' THEN NULL
    ELSE UPPER(agent_type)
  END,
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
  addon_type = CASE 
    WHEN addon_type IS NULL OR addon_type = '' THEN NULL
    ELSE UPPER(addon_type)
  END;

UPDATE master_benefits
SET 
  line_of_business = UPPER(line_of_business),
  benefit_name = UPPER(benefit_name),
  benefit_type = CASE 
    WHEN benefit_type IS NULL OR benefit_type = '' THEN NULL
    ELSE UPPER(benefit_type)
  END;