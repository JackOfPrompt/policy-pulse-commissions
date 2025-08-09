-- Just fix the essential data without changing constrained fields
-- Let's update the full_name to be more meaningful
UPDATE public.profiles SET 
  full_name = 'Admin User',
  phone = '9999999991'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET 
  full_name = 'Employee User',
  phone = '9999999992'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET 
  full_name = 'Branch Manager',
  phone = '9999999993'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET 
  full_name = 'Agent User',
  phone = '9999999996'
WHERE id = '66666666-6666-6666-6666-666666666666';

UPDATE public.profiles SET 
  full_name = 'Customer User',
  phone = '9999999998'
WHERE id = '88888888-8888-8888-8888-888888888888';