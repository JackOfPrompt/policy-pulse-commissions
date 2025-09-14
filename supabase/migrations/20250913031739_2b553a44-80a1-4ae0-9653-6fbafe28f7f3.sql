-- Check if superadmin profile exists and create if needed
INSERT INTO profiles (id, full_name, email, role, org_id, created_at, updated_at)
SELECT 
  au.id,
  'Super Admin',
  au.email,
  'superadmin',
  NULL,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'superadmin@insurtech.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);