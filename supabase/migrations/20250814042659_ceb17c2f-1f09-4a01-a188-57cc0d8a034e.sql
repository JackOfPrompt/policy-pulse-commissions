-- First, delete the existing system admin user
DELETE FROM user_credentials WHERE email = 'system@admin.com';
DELETE FROM profiles WHERE email = 'system@admin.com';

-- Create system admin with proper bcrypt hash for password "admin123"
INSERT INTO user_credentials (id, email, password_hash, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'system@admin.com',
  '$2b$12$LQv3c1yqBwlW68kK.FXueOVXOqOOmBl1yO1.oGPZlhBL0XqQcMu3O',
  true,
  now(),
  now()
);

-- Get the newly created credentials ID for the profile
INSERT INTO profiles (
  id,
  user_id,
  email,
  first_name,
  last_name,
  role,
  must_change_password,
  password_changed_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  uc.id,
  'system@admin.com',
  'System',
  'Administrator',
  'system_admin'::app_role,
  false,
  now(),
  now(),
  now()
FROM user_credentials uc 
WHERE uc.email = 'system@admin.com';