-- Create insurer_statement_items table
CREATE TABLE insurer_statement_items (
    item_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    insurer_id BIGINT NOT NULL,
    statement_period VARCHAR(20) NOT NULL,
    policy_number VARCHAR(100),
    premium_amount NUMERIC(14,2),
    commission_amount NUMERIC(14,2),
    item_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create settlement_links table
CREATE TABLE settlement_links (
    link_id BIGSERIAL PRIMARY KEY,
    earning_id BIGINT REFERENCES commission_earnings(earning_id),
    item_id BIGINT REFERENCES insurer_statement_items(item_id),
    matched_amount NUMERIC(14,2) NOT NULL,
    confidence NUMERIC(5,2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create premiums table with org mapping
CREATE TABLE IF NOT EXISTS premiums (
    premium_id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    org_id BIGINT REFERENCES tenant_organization(org_id),
    insurer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    policy_id BIGINT NOT NULL,
    gross_premium NUMERIC(12,2) NOT NULL,
    net_premium NUMERIC(12,2) NOT NULL,
    receipt_date DATE NOT NULL,
    ref_no VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Received',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Update commission_earnings table to include org_id if not exists
ALTER TABLE commission_earnings 
ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES tenant_organization(org_id);

-- Create revenue_allocation table
CREATE TABLE IF NOT EXISTS revenue_allocation (
    allocation_id BIGSERIAL PRIMARY KEY,
    earning_id BIGINT REFERENCES commission_earnings(earning_id),
    org_id BIGINT REFERENCES tenant_organization(org_id),
    share_percent NUMERIC(5,2) NOT NULL,
    allocated_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create premium_adjustments table
CREATE TABLE IF NOT EXISTS premium_adjustments (
    adjustment_id BIGSERIAL PRIMARY KEY,
    premium_id BIGINT REFERENCES premiums(premium_id),
    adjustment_type VARCHAR(50) NOT NULL, -- refund, chargeback, endorsement
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_insurer_statement_items_tenant ON insurer_statement_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settlement_links_earning ON settlement_links(earning_id);
CREATE INDEX IF NOT EXISTS idx_premiums_tenant_org ON premiums(tenant_id, org_id);
CREATE INDEX IF NOT EXISTS idx_premiums_receipt_date ON premiums(receipt_date);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_org_id ON commission_earnings(org_id);
CREATE INDEX IF NOT EXISTS idx_revenue_allocation_earning_id ON revenue_allocation(earning_id);

-- Add RLS policies
ALTER TABLE insurer_statement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE premiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
CREATE POLICY "Tenant users can view insurer statement items" ON insurer_statement_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id::text = insurer_statement_items.tenant_id::text OR role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage insurer statement items" ON insurer_statement_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id::text = insurer_statement_items.tenant_id::text OR role = 'system_admin'::app_role)
            AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant users can view settlement links" ON settlement_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN commission_earnings ce ON ce.earning_id = settlement_links.earning_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id = ce.tenant_id OR p.role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage settlement links" ON settlement_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN commission_earnings ce ON ce.earning_id = settlement_links.earning_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id = ce.tenant_id OR p.role = 'system_admin'::app_role)
            AND p.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant users can view their premiums" ON premiums
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id::text = premiums.tenant_id::text OR role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage their premiums" ON premiums
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id::text = premiums.tenant_id::text OR role = 'system_admin'::app_role)
            AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant users can view revenue allocations" ON revenue_allocation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN commission_earnings ce ON ce.earning_id = revenue_allocation.earning_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id = ce.tenant_id OR p.role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage revenue allocations" ON revenue_allocation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN commission_earnings ce ON ce.earning_id = revenue_allocation.earning_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id = ce.tenant_id OR p.role = 'system_admin'::app_role)
            AND p.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant users can view premium adjustments" ON premium_adjustments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN premiums pr ON pr.premium_id = premium_adjustments.premium_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id::text = pr.tenant_id::text OR p.role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage premium adjustments" ON premium_adjustments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN premiums pr ON pr.premium_id = premium_adjustments.premium_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id::text = pr.tenant_id::text OR p.role = 'system_admin'::app_role)
            AND p.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );