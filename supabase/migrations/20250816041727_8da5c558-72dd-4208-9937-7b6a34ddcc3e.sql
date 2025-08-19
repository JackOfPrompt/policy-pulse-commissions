-- Create tenant-specific master data extension tables

-- Tenant Product Categories
CREATE TABLE tenant_product_categories (
    tenant_category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenant_organizations(id) ON DELETE CASCADE,
    category_name text NOT NULL,
    category_code text NOT NULL,
    category_desc text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE (tenant_id, category_name),
    UNIQUE (tenant_id, category_code)
);

-- Tenant Insurance Providers
CREATE TABLE tenant_insurance_providers (
    tenant_provider_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenant_organizations(id) ON DELETE CASCADE,
    provider_name varchar(255) NOT NULL,
    provider_code varchar(50) NOT NULL,
    trade_name varchar(255),
    contact_email varchar(255),
    contact_phone varchar(20),
    contact_person varchar(255),
    address_line1 varchar(255),
    address_line2 varchar(255),
    state varchar(100),
    website_url text,
    notes text,
    status varchar(20) DEFAULT 'Active',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE (tenant_id, provider_name),
    UNIQUE (tenant_id, provider_code)
);

-- Tenant Policy Types
CREATE TABLE tenant_policy_types (
    tenant_policy_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenant_organizations(id) ON DELETE CASCADE,
    policy_type_name varchar(255) NOT NULL,
    policy_type_description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE (tenant_id, policy_type_name)
);

-- Tenant Plan Types
CREATE TABLE tenant_plan_types (
    tenant_plan_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenant_organizations(id) ON DELETE CASCADE,
    plan_type_name varchar(255) NOT NULL,
    description text,
    lob_id uuid REFERENCES master_line_of_business(lob_id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE (tenant_id, plan_type_name)
);

-- Tenant Health Conditions
CREATE TABLE tenant_health_conditions (
    tenant_condition_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenant_organizations(id) ON DELETE CASCADE,
    condition_name text NOT NULL,
    category text NOT NULL,
    description text,
    waiting_period text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE (tenant_id, condition_name)
);

-- Enable RLS on all tenant tables
ALTER TABLE tenant_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_policy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_plan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_health_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tenant Product Categories
CREATE POLICY "Tenant users can view their org categories" 
ON tenant_product_categories FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_product_categories.tenant_id
));

CREATE POLICY "Tenant admins can manage their org categories" 
ON tenant_product_categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_product_categories.tenant_id
  AND profiles.role IN ('tenant_admin', 'system_admin')
));

-- RLS Policies for Tenant Insurance Providers  
CREATE POLICY "Tenant users can view their org providers" 
ON tenant_insurance_providers FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_insurance_providers.tenant_id
));

CREATE POLICY "Tenant admins can manage their org providers" 
ON tenant_insurance_providers FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_insurance_providers.tenant_id
  AND profiles.role IN ('tenant_admin', 'system_admin')
));

-- RLS Policies for Tenant Policy Types
CREATE POLICY "Tenant users can view their org policy types" 
ON tenant_policy_types FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_policy_types.tenant_id
));

CREATE POLICY "Tenant admins can manage their org policy types" 
ON tenant_policy_types FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_policy_types.tenant_id
  AND profiles.role IN ('tenant_admin', 'system_admin')
));

-- RLS Policies for Tenant Plan Types
CREATE POLICY "Tenant users can view their org plan types" 
ON tenant_plan_types FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_plan_types.tenant_id
));

CREATE POLICY "Tenant admins can manage their org plan types" 
ON tenant_plan_types FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_plan_types.tenant_id
  AND profiles.role IN ('tenant_admin', 'system_admin')
));

-- RLS Policies for Tenant Health Conditions
CREATE POLICY "Tenant users can view their org health conditions" 
ON tenant_health_conditions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_health_conditions.tenant_id
));

CREATE POLICY "Tenant admins can manage their org health conditions" 
ON tenant_health_conditions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.tenant_id = tenant_health_conditions.tenant_id
  AND profiles.role IN ('tenant_admin', 'system_admin')
));

-- Create triggers for updated_at fields
CREATE TRIGGER update_tenant_product_categories_updated_at
    BEFORE UPDATE ON tenant_product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_insurance_providers_updated_at
    BEFORE UPDATE ON tenant_insurance_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_policy_types_updated_at
    BEFORE UPDATE ON tenant_policy_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_plan_types_updated_at
    BEFORE UPDATE ON tenant_plan_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_health_conditions_updated_at
    BEFORE UPDATE ON tenant_health_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();