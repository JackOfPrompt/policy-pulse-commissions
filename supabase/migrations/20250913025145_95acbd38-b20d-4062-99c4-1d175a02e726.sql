-- Create default superadmin user
-- Note: This inserts directly into auth.users which should be done carefully
-- In production, you would typically create this through the Supabase dashboard

-- First, let's create a profile for superadmin
INSERT INTO public.profiles (id, full_name, email, role) 
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- Fixed UUID for superadmin
  'Super Administrator',
  'superadmin@insurtech.com',
  'superadmin'
) ON CONFLICT (id) DO NOTHING;

-- Create user_organizations entry for superadmin (no specific org)
INSERT INTO public.user_organizations (user_id, org_id, role)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  NULL, -- Superadmin doesn't belong to any specific org
  'superadmin'
) ON CONFLICT (user_id, org_id) DO NOTHING;