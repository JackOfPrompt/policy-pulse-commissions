-- First check what the valid values are for kyc_status
-- Let's try with common KYC status values
INSERT INTO public.profiles (id, email, full_name, user_type, employee_role, agent_type, is_active, kyc_status, phone) VALUES 
-- Admin user
('11111111-1111-1111-1111-111111111111', 'admin@test.com', 'Admin User', 'Admin', 'Admin', NULL, true, 'pending', '+91-9999999991'),
-- Employee users
('22222222-2222-2222-2222-222222222222', 'employee@test.com', 'Employee User', 'Employee', 'Sales', NULL, true, 'pending', '+91-9999999992'),
('33333333-3333-3333-3333-333333333333', 'manager@test.com', 'Branch Manager', 'Employee', 'Branch Manager', NULL, true, 'pending', '+91-9999999993'),
('44444444-4444-4444-4444-444444444444', 'ops@test.com', 'Operations Manager', 'Employee', 'Ops', NULL, true, 'pending', '+91-9999999994'),
('55555555-5555-5555-5555-555555555555', 'finance@test.com', 'Finance Manager', 'Employee', 'Finance', NULL, true, 'pending', '+91-9999999995'),
-- Agent users
('66666666-6666-6666-6666-666666666666', 'agent1@test.com', 'MISP Agent', 'Agent', NULL, 'MISP', true, 'pending', '+91-9999999996'),
('77777777-7777-7777-7777-777777777777', 'agent2@test.com', 'POSP Agent', 'Agent', NULL, 'POSP', true, 'pending', '+91-9999999997'),
-- Customer user
('88888888-8888-8888-8888-888888888888', 'customer@test.com', 'Customer User', 'Customer', NULL, NULL, true, 'pending', '+91-9999999998')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  employee_role = EXCLUDED.employee_role,
  agent_type = EXCLUDED.agent_type,
  kyc_status = EXCLUDED.kyc_status;