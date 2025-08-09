-- Create test users in auth.users table
-- Note: In production, users would sign up normally, but for testing we can insert directly

-- Insert test users into auth.users (this bypasses normal signup flow for testing)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES 
-- Admin user (password: admin123)
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'admin@test.com', '$2a$10$TKh8H1.PfQx37YgCzwiKb.p5R.CpI5VhKZw1.ZjXoWYz6QqIZ7.C2', now(), now(), now(), 'authenticated', 'authenticated', '', '', ''),
-- Employee user (password: employee123)
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'employee@test.com', '$2a$10$TKh8H1.PfQx37YgCzwiKb.p5R.CpI5VhKZw1.ZjXoWYz6QqIZ7.C2', now(), now(), now(), 'authenticated', 'authenticated', '', '', ''),
-- Manager user (password: manager123)
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'manager@test.com', '$2a$10$TKh8H1.PfQx37YgCzwiKb.p5R.CpI5VhKZw1.ZjXoWYz6QqIZ7.C2', now(), now(), now(), 'authenticated', 'authenticated', '', '', ''),
-- Agent user (password: agent123)
('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'agent1@test.com', '$2a$10$TKh8H1.PfQx37YgCzwiKb.p5R.CpI5VhKZw1.ZjXoWYz6QqIZ7.C2', now(), now(), now(), 'authenticated', 'authenticated', '', '', ''),
-- Customer user (password: customer123)
('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'customer@test.com', '$2a$10$TKh8H1.PfQx37YgCzwiKb.p5R.CpI5VhKZw1.ZjXoWYz6QqIZ7.C2', now(), now(), now(), 'authenticated', 'authenticated', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user roles
INSERT INTO public.user_roles (user_id, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin'),
('22222222-2222-2222-2222-222222222222', 'user'),
('33333333-3333-3333-3333-333333333333', 'manager'),
('66666666-6666-6666-6666-666666666666', 'user'),
('88888888-8888-8888-8888-888888888888', 'user')
ON CONFLICT (user_id, role) DO NOTHING;