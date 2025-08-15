-- Create test user profiles for the demo credentials
INSERT INTO public.user_credentials (id, email, password_hash, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@system.com', 'admin123', true),
('22222222-2222-2222-2222-222222222222', 'tenant@admin.com', 'tenant123', true),
('33333333-3333-3333-3333-333333333333', 'employee@company.com', 'employee123', true),
('44444444-4444-4444-4444-444444444444', 'agent@insurance.com', 'agent123', true),
('55555555-5555-5555-5555-555555555555', 'customer@email.com', 'customer123', true)
ON CONFLICT (email) DO NOTHING;

-- Create corresponding profiles for each user
INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@system.com', 'System', 'Administrator', 'system_admin', false),
('22222222-2222-2222-2222-222222222222', 'tenant@admin.com', 'Tenant', 'Admin', 'tenant_admin', false),
('33333333-3333-3333-3333-333333333333', 'employee@company.com', 'Company', 'Employee', 'tenant_employee', false),
('44444444-4444-4444-4444-444444444444', 'agent@insurance.com', 'Insurance', 'Agent', 'tenant_agent', false),
('55555555-5555-5555-5555-555555555555', 'customer@email.com', 'John', 'Customer', 'customer', false)
ON CONFLICT (user_id) DO NOTHING;