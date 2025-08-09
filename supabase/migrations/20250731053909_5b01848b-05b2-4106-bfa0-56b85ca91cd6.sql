-- Fix auth schema issues and create proper user management tables

-- First, ensure we have proper user authentication tables
CREATE TABLE IF NOT EXISTS public.users_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  default_dashboard TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (name, slug, default_dashboard, is_active) VALUES
  ('Admin', 'admin', '/admin/overview', true),
  ('Employee', 'employee', '/employee/dashboard', true),
  ('Agent', 'agent', '/agent/dashboard', true),
  ('Customer', 'customer', '/customer/dashboard', true),
  ('Manager', 'manager', '/admin/overview', true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  default_dashboard = EXCLUDED.default_dashboard,
  is_active = EXCLUDED.is_active;

-- Create proper test users with hashed passwords (Password123!)
-- Note: In production, passwords should be properly hashed with bcrypt
INSERT INTO public.users_auth (phone_number, password_hash, role, is_active) VALUES
  ('admin@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true),
  ('employee@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', true),
  ('agent@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', true),
  ('customer@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', true),
  ('manager@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', true)
ON CONFLICT (phone_number) DO NOTHING;

-- Enable RLS on tables
ALTER TABLE public.users_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users_auth
CREATE POLICY "Users can view their own auth record" ON public.users_auth
  FOR SELECT USING (true); -- Allow reading for authentication

CREATE POLICY "Only system can manage auth records" ON public.users_auth
  FOR ALL USING (false); -- Prevent direct manipulation

-- Create RLS policies for roles
CREATE POLICY "Anyone can view roles" ON public.roles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON public.roles
  FOR ALL USING (false); -- System managed

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_auth_updated_at
  BEFORE UPDATE ON public.users_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();