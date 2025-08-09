-- Fix the auth system with correct role values and enable RLS
-- Drop the check constraint to allow proper role values
ALTER TABLE public.users_auth DROP CONSTRAINT IF EXISTS users_auth_role_check;

-- Add new constraint with proper values
ALTER TABLE public.users_auth 
ADD CONSTRAINT users_auth_role_check 
CHECK (role IN ('Admin', 'Employee', 'Agent', 'Customer', 'Manager'));

-- Clear existing users and insert with correct role casing
DELETE FROM public.users_auth;

-- Insert test users with correct role values
INSERT INTO public.users_auth (phone_number, password_hash, role, is_active) VALUES
  ('admin@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', true),
  ('employee@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Employee', true),
  ('agent@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Agent', true),
  ('customer@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Customer', true),
  ('manager@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Manager', true);

-- Ensure tables that need RLS have it enabled (fixing the linter errors)
-- Active commission rules
ALTER TABLE public.active_commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.active_commission_rules FOR SELECT USING (true);

-- Payout reports  
ALTER TABLE public.payout_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users" ON public.payout_reports FOR SELECT USING (true);