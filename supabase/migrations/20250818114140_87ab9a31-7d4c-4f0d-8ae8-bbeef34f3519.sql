-- Create settlement_links table (as it's the only one requested)
CREATE TABLE IF NOT EXISTS settlement_links (
    link_id BIGSERIAL PRIMARY KEY,
    earning_id BIGINT REFERENCES commission_earnings(earning_id),
    item_id BIGINT REFERENCES insurer_statement_items(item_id),
    matched_amount NUMERIC(14,2) NOT NULL,
    confidence NUMERIC(5,2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settlement_links ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
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

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_settlement_links_earning ON settlement_links(earning_id);
CREATE INDEX IF NOT EXISTS idx_settlement_links_item ON settlement_links(item_id);