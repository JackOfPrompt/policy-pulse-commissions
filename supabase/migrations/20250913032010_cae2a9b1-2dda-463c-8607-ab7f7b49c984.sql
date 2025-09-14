-- Create superadmin profile entry with correct role name
INSERT INTO profiles (id, full_name, email, role, org_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Super Admin',
  'superadmin@insurtech.com',
  'super_admin',
  NULL,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  email = 'superadmin@insurtech.com',
  full_name = 'Super Admin';