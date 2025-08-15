-- Create test users for all roles
-- First, create credentials for each role
INSERT INTO public.user_credentials (id, email, password_hash, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@system.com', 'admin123', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'tenant@admin.com', 'tenant123', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'employee@company.com', 'employee123', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'agent@insurance.com', 'agent123', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'customer@email.com', 'customer123', true)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  is_active = EXCLUDED.is_active;

-- Create profiles for each test user
INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@system.com', 'System', 'Administrator', 'system_admin', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'tenant@admin.com', 'Tenant', 'Admin', 'tenant_admin', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'employee@company.com', 'Company', 'Employee', 'tenant_employee', false),
  ('550e8400-e29b-41d4-a716-446655440004', 'agent@insurance.com', 'Insurance', 'Agent', 'tenant_agent', false),
  ('550e8400-e29b-41d4-a716-446655440005', 'customer@email.com', 'John', 'Customer', 'customer', false)
ON CONFLICT (user_id) DO UPDATE SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  must_change_password = EXCLUDED.must_change_password;