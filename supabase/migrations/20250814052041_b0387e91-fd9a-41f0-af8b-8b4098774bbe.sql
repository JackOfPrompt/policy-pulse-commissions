-- Update auth system to support multiple test users
-- First update the useAuth hook logic by updating existing credentials and profiles

-- Delete existing test data to recreate clean
DELETE FROM public.profiles WHERE email IN ('admin@system.com', 'tenant@admin.com', 'employee@company.com', 'agent@insurance.com', 'customer@email.com');
DELETE FROM public.user_credentials WHERE email IN ('admin@system.com', 'tenant@admin.com', 'employee@company.com', 'agent@insurance.com', 'customer@email.com');

-- Create credentials for each role with fixed UUIDs
INSERT INTO public.user_credentials (id, email, password_hash, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@system.com', 'admin123', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'tenant@admin.com', 'tenant123', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'employee@company.com', 'employee123', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'agent@insurance.com', 'agent123', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'customer@email.com', 'customer123', true);

-- Create profiles for each test user
INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@system.com', 'System', 'Administrator', 'system_admin', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'tenant@admin.com', 'Tenant', 'Admin', 'tenant_admin', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'employee@company.com', 'Company', 'Employee', 'tenant_employee', false),
  ('550e8400-e29b-41d4-a716-446655440004', 'agent@insurance.com', 'Insurance', 'Agent', 'tenant_agent', false),
  ('550e8400-e29b-41d4-a716-446655440005', 'customer@email.com', 'John', 'Customer', 'customer', false);