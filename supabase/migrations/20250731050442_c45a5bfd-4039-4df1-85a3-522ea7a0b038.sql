-- Disable RLS on actual tables only (not views)
ALTER TABLE public.agent_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_reconciliation DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rule_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_slabs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tier_multipliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_slas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_commission_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_of_business DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_vehicle_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies_new DISABLE ROW LEVEL SECURITY;

-- Create test users and credentials
-- Insert test profiles for different user types
INSERT INTO public.profiles (id, email, full_name, user_type, employee_role, agent_type, is_active, kyc_status, phone) VALUES 
-- Admin user
('11111111-1111-1111-1111-111111111111', 'admin@test.com', 'Admin User', 'Admin', 'Admin', NULL, true, 'verified', '+91-9999999991'),
-- Employee users
('22222222-2222-2222-2222-222222222222', 'employee@test.com', 'Employee User', 'Employee', 'Sales', NULL, true, 'verified', '+91-9999999992'),
('33333333-3333-3333-3333-333333333333', 'manager@test.com', 'Branch Manager', 'Employee', 'Branch Manager', NULL, true, 'verified', '+91-9999999993'),
('44444444-4444-4444-4444-444444444444', 'ops@test.com', 'Operations Manager', 'Employee', 'Ops', NULL, true, 'verified', '+91-9999999994'),
('55555555-5555-5555-5555-555555555555', 'finance@test.com', 'Finance Manager', 'Employee', 'Finance', NULL, true, 'verified', '+91-9999999995'),
-- Agent users
('66666666-6666-6666-6666-666666666666', 'agent1@test.com', 'MISP Agent', 'Agent', NULL, 'MISP', true, 'verified', '+91-9999999996'),
('77777777-7777-7777-7777-777777777777', 'agent2@test.com', 'POSP Agent', 'Agent', NULL, 'POSP', true, 'verified', '+91-9999999997'),
-- Customer user
('88888888-8888-8888-8888-888888888888', 'customer@test.com', 'Customer User', 'Customer', NULL, NULL, true, 'verified', '+91-9999999998')
ON CONFLICT (id) DO NOTHING;

-- Create user roles for the test users
INSERT INTO public.user_roles (user_id, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin'),
('22222222-2222-2222-2222-222222222222', 'sales'),
('33333333-3333-3333-3333-333333333333', 'manager'),
('44444444-4444-4444-4444-444444444444', 'ops'),
('55555555-5555-5555-5555-555555555555', 'finance'),
('66666666-6666-6666-6666-666666666666', 'agent'),
('77777777-7777-7777-7777-777777777777', 'agent'),
('88888888-8888-8888-8888-888888888888', 'customer')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a test branch
INSERT INTO public.branches (id, name, code, address, city, state, pincode, phone, email, manager_name, manager_phone, status) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Branch', 'TB001', '123 Test Street', 'Mumbai', 'Maharashtra', '400001', '+91-22-12345678', 'testbranch@test.com', 'Test Manager', '+91-9999999999', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Create test employee records
INSERT INTO public.employees (id, employee_id, name, email, phone, role, branch_id, status, joining_date, user_id) VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EMP001', 'Admin User', 'admin@test.com', '+91-9999999991', 'admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active', CURRENT_DATE, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'EMP002', 'Employee User', 'employee@test.com', '+91-9999999992', 'sales', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active', CURRENT_DATE, '22222222-2222-2222-2222-222222222222'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'EMP003', 'Branch Manager', 'manager@test.com', '+91-9999999993', 'manager', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active', CURRENT_DATE, '33333333-3333-3333-3333-333333333333'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'EMP004', 'Operations Manager', 'ops@test.com', '+91-9999999994', 'ops', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active', CURRENT_DATE, '44444444-4444-4444-4444-444444444444'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'EMP005', 'Finance Manager', 'finance@test.com', '+91-9999999995', 'finance', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active', CURRENT_DATE, '55555555-5555-5555-5555-555555555555')
ON CONFLICT (id) DO NOTHING;

-- Create test agent records
INSERT INTO public.agents (id, agent_code, name, email, phone, agent_type, branch_id, status, joining_date, user_id, irdai_certified) VALUES 
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'AGT001', 'MISP Agent', 'agent1@test.com', '+91-9999999996', 'MISP', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active', CURRENT_DATE, '66666666-6666-6666-6666-666666666666', true),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'AGT002', 'POSP Agent', 'agent2@test.com', '+91-9999999997', 'POSP', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Active', CURRENT_DATE, '77777777-7777-7777-7777-777777777777', true)
ON CONFLICT (id) DO NOTHING;