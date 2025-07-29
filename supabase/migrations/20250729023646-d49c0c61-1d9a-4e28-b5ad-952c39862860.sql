-- Create User table for phone-based authentication
CREATE TABLE public.users_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Employee', 'Agent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  otp_code TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on phone_number for faster lookups
CREATE INDEX idx_users_auth_phone_number ON public.users_auth(phone_number);

-- Enable Row Level Security
ALTER TABLE public.users_auth ENABLE ROW LEVEL SECURITY;

-- Create policies for users_auth table
CREATE POLICY "Anyone can read user auth data"
ON public.users_auth
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can insert user auth data"
ON public.users_auth
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update user auth data"
ON public.users_auth
FOR UPDATE
TO public
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_users_auth_updated_at
BEFORE UPDATE ON public.users_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert test admin user
INSERT INTO public.users_auth (phone_number, password_hash, role, is_active)
VALUES ('9999999999', '$2b$10$8K1p/a0dqailSurmiU.lmeMTMh56xu/kzNJwt/Q9y7v6PjJRqZ9Ey', 'Admin', true);

-- Note: The password hash above is for 'Admin@123' using bcrypt