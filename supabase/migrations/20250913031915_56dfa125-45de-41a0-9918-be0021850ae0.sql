-- Create superadmin profile entry that will work with the authentication fallback mechanism
-- This creates a profile that will be picked up by the auth context fallback

-- First, let's ensure we have the user in user_organizations table for superadmin access
-- We'll use a placeholder UUID for now - this will be updated when the actual user is created

-- Create a profile entry that will match the email when user signs up
INSERT INTO profiles (id, full_name, email, role, org_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Placeholder UUID
  'Super Admin',
  'superadmin@insurtech.com',
  'superadmin',
  NULL,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'superadmin',
  email = 'superadmin@insurtech.com',
  full_name = 'Super Admin';