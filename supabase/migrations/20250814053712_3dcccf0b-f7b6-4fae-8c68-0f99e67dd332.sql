-- Update existing profiles to match test credentials
UPDATE public.profiles 
SET 
  first_name = 'System',
  last_name = 'Administrator',
  role = 'system_admin',
  must_change_password = false
WHERE email = 'admin@system.com';

-- Insert missing profiles for test credentials (only if they don't exist)
INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password) 
SELECT 
  '22222222-2222-2222-2222-222222222222', 
  'tenant@admin.com', 
  'Tenant', 
  'Admin', 
  'tenant_admin', 
  false
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'tenant@admin.com');

INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password) 
SELECT 
  '33333333-3333-3333-3333-333333333333', 
  'employee@company.com', 
  'Company', 
  'Employee', 
  'tenant_employee', 
  false
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'employee@company.com');

INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password) 
SELECT 
  '44444444-4444-4444-4444-444444444444', 
  'agent@insurance.com', 
  'Insurance', 
  'Agent', 
  'tenant_agent', 
  false
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'agent@insurance.com');

INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password) 
SELECT 
  '55555555-5555-5555-5555-555555555555', 
  'customer@email.com', 
  'John', 
  'Customer', 
  'customer', 
  false
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'customer@email.com');