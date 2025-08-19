-- Commission Rules Master Table with enhanced schema
CREATE TABLE commission_rules (
    rule_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    insurer_id UUID REFERENCES master_insurance_providers(provider_id),
    product_id UUID REFERENCES master_product_name(product_id),
    lob_id UUID REFERENCES master_line_of_business(lob_id),
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN ('Fixed', 'Slab', 'Flat', 'Renewal', 'Bonus', 'Tiered', 'Campaign')),
    base_rate DECIMAL(5,2),
    channel VARCHAR(50),
    policy_year INT DEFAULT 1,
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expired')),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, insurer_id, product_id, policy_year, valid_from)
);

-- Commission Slabs (Premium-based and Business Volume-based)
CREATE TABLE commission_slabs (
    slab_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    min_value DECIMAL(12,2) NOT NULL,
    max_value DECIMAL(12,2),
    rate DECIMAL(5,2) NOT NULL,
    slab_type VARCHAR(20) DEFAULT 'Premium' CHECK (slab_type IN ('Premium', 'BusinessVolume')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (rule_id, min_value, max_value, slab_type)
);

-- Flat Rates (per policy or per unit)
CREATE TABLE commission_flat (
    flat_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    flat_amount DECIMAL(12,2) NOT NULL,
    unit_type VARCHAR(20) DEFAULT 'PerPolicy' CHECK (unit_type IN ('PerPolicy', 'PerVehicle', 'PerMember')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Renewal Bonus (Year-based)
CREATE TABLE commission_renewal (
    renewal_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    policy_year INT NOT NULL,
    renewal_rate DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (rule_id, policy_year)
);

-- Business Slab Bonus (volume-based)
CREATE TABLE commission_business_bonus (
    bonus_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    min_gwp DECIMAL(15,2) NOT NULL,
    max_gwp DECIMAL(15,2),
    bonus_rate DECIMAL(5,2) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'Monthly' CHECK (period_type IN ('Monthly', 'Quarterly', 'Yearly')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tiered Bonus (Status level)
CREATE TABLE commission_tiers (
    tier_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    tier_name VARCHAR(50) NOT NULL,
    min_business DECIMAL(15,2) NOT NULL,
    max_business DECIMAL(15,2),
    extra_bonus DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Time-Bound Bonus (campaigns)
CREATE TABLE commission_time_bonus (
    time_bonus_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    bonus_rate DECIMAL(5,2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    campaign_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (valid_to > valid_from)
);

-- Commission Overrides
CREATE TABLE commission_overrides (
    override_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    override_type VARCHAR(30) NOT NULL CHECK (override_type IN ('Campaign', 'Volume', 'Loyalty', 'Special')),
    override_rate DECIMAL(5,2) NOT NULL,
    approval_status VARCHAR(20) DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID,
    approved_at TIMESTAMP,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (valid_to > valid_from)
);

-- IRDAI Compliance Rules
CREATE TABLE irdai_commission_caps (
    cap_id BIGSERIAL PRIMARY KEY,
    lob_id UUID REFERENCES master_line_of_business(lob_id),
    product_category VARCHAR(100),
    channel VARCHAR(50),
    policy_year INT,
    max_commission_percent DECIMAL(5,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lob_id, product_category, channel, policy_year, effective_from)
);

-- Commission History/Audit
CREATE TABLE commission_audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules(rule_id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_flat ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_renewal ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_business_bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_time_bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE irdai_commission_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Commission Rules
CREATE POLICY "Tenant users can view their commission rules" ON commission_rules
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND (profiles.tenant_id = commission_rules.tenant_id OR profiles.role = 'system_admin'::app_role)
    )
);

CREATE POLICY "Tenant admins can manage their commission rules" ON commission_rules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND (profiles.tenant_id = commission_rules.tenant_id OR profiles.role = 'system_admin'::app_role)
        AND profiles.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
    )
);

-- Similar policies for other commission tables
CREATE POLICY "Tenant users can view commission slabs" ON commission_slabs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN commission_rules cr ON cr.rule_id = commission_slabs.rule_id
        WHERE p.user_id = auth.uid()
        AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
    )
);

CREATE POLICY "Tenant admins can manage commission slabs" ON commission_slabs
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN commission_rules cr ON cr.rule_id = commission_slabs.rule_id
        WHERE p.user_id = auth.uid()
        AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
        AND p.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
    )
);

-- Apply similar patterns to other tables
CREATE POLICY "Tenant users can view commission flat" ON commission_flat
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN commission_rules cr ON cr.rule_id = commission_flat.rule_id
        WHERE p.user_id = auth.uid()
        AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
    )
);

CREATE POLICY "Tenant admins can manage commission flat" ON commission_flat
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN commission_rules cr ON cr.rule_id = commission_flat.rule_id
        WHERE p.user_id = auth.uid()
        AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
        AND p.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
    )
);

-- IRDAI caps - read access for all authenticated users, manage for system admins only
CREATE POLICY "All authenticated users can view IRDAI caps" ON irdai_commission_caps
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage IRDAI caps" ON irdai_commission_caps
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'system_admin'::app_role
    )
);

-- Commission audit log policies
CREATE POLICY "Tenant users can view commission audit logs" ON commission_audit_log
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN commission_rules cr ON cr.rule_id = commission_audit_log.rule_id
        WHERE p.user_id = auth.uid()
        AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
    )
);

CREATE POLICY "System can insert audit logs" ON commission_audit_log
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create updated_at trigger for commission_rules
CREATE OR REPLACE FUNCTION update_commission_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commission_rules_updated_at
BEFORE UPDATE ON commission_rules
FOR EACH ROW
EXECUTE FUNCTION update_commission_rules_updated_at();

-- Insert sample IRDAI caps
INSERT INTO irdai_commission_caps (lob_id, product_category, channel, policy_year, max_commission_percent, effective_from) VALUES
(
    (SELECT lob_id FROM master_line_of_business WHERE lob_name = 'Health' LIMIT 1),
    'Individual Health',
    'Agent',
    1,
    18.00,
    '2024-01-01'
),
(
    (SELECT lob_id FROM master_line_of_business WHERE lob_name = 'Motor' LIMIT 1),
    'Motor Insurance',
    'Agent',
    1,
    15.00,
    '2024-01-01'
);