-- Insert sample data for testing finance management
-- First, let's create a sample tenant_id from existing profiles
DO $$ 
DECLARE
    sample_tenant_id UUID;
BEGIN
    -- Get a tenant_id from profiles table or create a sample one
    SELECT tenant_id INTO sample_tenant_id FROM profiles WHERE tenant_id IS NOT NULL LIMIT 1;
    
    IF sample_tenant_id IS NULL THEN
        sample_tenant_id := gen_random_uuid();
    END IF;

    -- Sample finance accounts
    INSERT INTO finance_accounts (account_code, account_name, type, tenant_id) VALUES
    ('1001', 'Cash in Hand', 'Asset', sample_tenant_id),
    ('1002', 'Bank Account - Current', 'Asset', sample_tenant_id),
    ('2001', 'Commission Payable', 'Liability', sample_tenant_id),
    ('4001', 'Premium Income', 'Income', sample_tenant_id),
    ('5001', 'Commission Expense', 'Expense', sample_tenant_id)
    ON CONFLICT (account_code) DO NOTHING;

    -- Sample settlements
    INSERT INTO finance_settlements (insurer_id, period, expected_amount, received_amount, variance_amount, status, tenant_id) VALUES
    (gen_random_uuid(), '2024-01-01', 150000, 148500, -1500, 'Pending', sample_tenant_id),
    (gen_random_uuid(), '2024-01-01', 200000, 200000, 0, 'Reconciled', sample_tenant_id),
    (gen_random_uuid(), '2024-01-01', 75000, 70000, -5000, 'Pending', sample_tenant_id);

    -- Sample payouts
    INSERT INTO finance_payouts (org_id, agent_name, amount, request_date, status, tenant_id, breakdown) VALUES
    (gen_random_uuid(), 'Agent A001 - John Doe', 15000, '2024-01-15', 'Requested', sample_tenant_id, 
     '{"base_commission": 12000, "renewal_bonus": 2000, "performance_bonus": 1000}'::jsonb),
    (gen_random_uuid(), 'Branch B001 - Mumbai Office', 25000, '2024-01-14', 'Approved', sample_tenant_id,
     '{"branch_commission": 20000, "override_commission": 5000}'::jsonb),
    (gen_random_uuid(), 'Agent A002 - Jane Smith', 8500, '2024-01-16', 'Paid', sample_tenant_id,
     '{"base_commission": 7500, "target_achievement": 1000}'::jsonb);

    -- Sample variances
    INSERT INTO finance_variances (type, reference_id, expected_value, actual_value, difference, status, description, tenant_id) VALUES
    ('Insurer', gen_random_uuid(), 150000, 148500, -1500, 'Open', 'Settlement shortfall from XYZ Insurance Co.', sample_tenant_id),
    ('Revenue', gen_random_uuid(), 100000, 102500, 2500, 'Under Review', 'Excess premium recorded vs expected', sample_tenant_id),
    ('Payout', gen_random_uuid(), 8500, 7750, -750, 'Resolved', 'Commission calculation discrepancy resolved', sample_tenant_id);

END $$;