-- Fix the user profile data for proper user types (using valid kyc_status)
UPDATE public.profiles SET 
  user_type = 'Admin',
  employee_role = 'Admin',
  kyc_status = 'Pending'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET 
  user_type = 'Employee',
  employee_role = 'Sales',
  kyc_status = 'Pending'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET 
  user_type = 'Employee', 
  employee_role = 'Branch Manager',
  kyc_status = 'Pending'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET 
  user_type = 'Agent',
  agent_type = 'MISP',
  kyc_status = 'Pending'
WHERE id = '66666666-6666-6666-6666-666666666666';

UPDATE public.profiles SET 
  user_type = 'Customer',
  kyc_status = 'Pending'
WHERE id = '88888888-8888-8888-8888-888888888888';

-- Also fix the phone numbers
UPDATE public.profiles SET phone = '9999999991' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET phone = '9999999992' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET phone = '9999999993' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE public.profiles SET phone = '9999999996' WHERE id = '66666666-6666-6666-6666-666666666666';
UPDATE public.profiles SET phone = '9999999998' WHERE id = '88888888-8888-8888-8888-888888888888';