-- Create default system admin user
INSERT INTO public.user_credentials (id, email, password_hash, is_active)
VALUES (
  gen_random_uuid(),
  'admin@system.com',
  '$2a$12$LQv3c1yqBwlVHpPjrQgt8uVNJzPe8P/9.zQZQ8mPZQV8mPZQV8mPZ', -- password: admin123
  true
) ON CONFLICT (email) DO NOTHING;

-- Create corresponding profile for system admin
INSERT INTO public.profiles (user_id, email, first_name, last_name, role, must_change_password)
SELECT 
  uc.id,
  uc.email,
  'System',
  'Administrator',
  'system_admin'::app_role,
  false
FROM public.user_credentials uc
WHERE uc.email = 'admin@system.com'
ON CONFLICT (user_id) DO NOTHING;

-- Update the password hash with proper bcrypt hash for 'admin123'
UPDATE public.user_credentials 
SET password_hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'admin@system.com';