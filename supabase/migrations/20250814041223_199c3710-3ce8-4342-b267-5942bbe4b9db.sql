-- Remove foreign key constraint from profiles to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Create a table to store user credentials directly
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS on user_credentials
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Add unique constraint on email for profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Insert system admin credentials (password is hashed version of '123456')
INSERT INTO public.user_credentials (email, password_hash)
VALUES ('system@admin.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTV5DEYY0z5tG7m')
ON CONFLICT (email) DO NOTHING;

-- Insert system admin profile
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  role,
  must_change_password,
  password_changed_at
) VALUES (
  gen_random_uuid(),
  'system@admin.com',
  'System',
  'Administrator',
  'system_admin',
  false,
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  must_change_password = EXCLUDED.must_change_password;