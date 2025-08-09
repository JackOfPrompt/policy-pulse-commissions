-- Update existing data to UPPERCASE for consistency, excluding fields with check constraints
-- Insurance Providers
UPDATE insurance_providers
SET 
  provider_name = UPPER(provider_name),
  irdai_code = CASE 
    WHEN irdai_code IS NULL OR irdai_code = '' THEN NULL
    ELSE UPPER(irdai_code)
  END;

-- Insurance Products (excluding coverage_type and premium_type due to check constraints)
UPDATE insurance_products
SET 
  name = UPPER(name),
  code = UPPER(code),
  category = UPPER(category),
  product_type = CASE 
    WHEN product_type IS NULL OR product_type = '' THEN NULL
    ELSE UPPER(product_type)
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