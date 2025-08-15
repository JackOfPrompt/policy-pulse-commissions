-- Fix the user_id mismatch for system admin
-- Update the profile to use the correct user_id from credentials
UPDATE profiles 
SET user_id = (SELECT id FROM user_credentials WHERE email = 'system@admin.com')
WHERE email = 'system@admin.com' AND role = 'system_admin';

-- Set a known password for system admin (password: admin123)
UPDATE user_credentials 
SET password_hash = '$2b$12$rZ6jkn4I8s9c3BhB6TtlZOfVZ3o0b6.n6X8Zv8Zv8Zv8Zv8Zv8Zv8O'
WHERE email = 'system@admin.com';