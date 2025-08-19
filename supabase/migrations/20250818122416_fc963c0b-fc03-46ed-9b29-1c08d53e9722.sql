-- Enable RLS on all finance tables
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_variances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finance_accounts
CREATE POLICY "Tenant users can view their accounts" ON finance_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_accounts.tenant_id OR role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage their accounts" ON finance_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_accounts.tenant_id OR role = 'system_admin'::app_role)
            AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

-- RLS Policies for finance_journals
CREATE POLICY "Tenant users can view their journals" ON finance_journals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_journals.tenant_id OR role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage their journals" ON finance_journals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_journals.tenant_id OR role = 'system_admin'::app_role)
            AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

-- RLS Policies for finance_journal_lines
CREATE POLICY "Tenant users can view their journal lines" ON finance_journal_lines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN finance_journals fj ON fj.journal_id = finance_journal_lines.journal_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id = fj.tenant_id OR p.role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage their journal lines" ON finance_journal_lines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN finance_journals fj ON fj.journal_id = finance_journal_lines.journal_id
            WHERE p.user_id = auth.uid() 
            AND (p.tenant_id = fj.tenant_id OR p.role = 'system_admin'::app_role)
            AND p.role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

-- RLS Policies for finance_settlements
CREATE POLICY "Tenant users can view their settlements" ON finance_settlements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_settlements.tenant_id OR role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage their settlements" ON finance_settlements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_settlements.tenant_id OR role = 'system_admin'::app_role)
            AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

-- RLS Policies for finance_payouts
CREATE POLICY "Tenant users can view their payouts" ON finance_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_payouts.tenant_id OR role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage their payouts" ON finance_payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_payouts.tenant_id OR role = 'system_admin'::app_role)
            AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );

-- RLS Policies for finance_variances
CREATE POLICY "Tenant users can view their variances" ON finance_variances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_variances.tenant_id OR role = 'system_admin'::app_role)
        )
    );

CREATE POLICY "Tenant admins can manage their variances" ON finance_variances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND (tenant_id = finance_variances.tenant_id OR role = 'system_admin'::app_role)
            AND role IN ('tenant_admin'::app_role, 'system_admin'::app_role)
        )
    );