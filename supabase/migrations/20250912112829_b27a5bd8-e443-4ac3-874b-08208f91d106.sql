-- Create profiles table for extended user metadata
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  department TEXT,
  sub_department TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'agent', 'employee', 'customer')),
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user sessions table for audit logging
CREATE TABLE public.user_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  ip_address TEXT,
  device TEXT,
  session_token TEXT
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = _role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user is in same org
CREATE OR REPLACE FUNCTION public.is_same_org(_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND org_id = _org_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (has_role('superladmin'));

-- User sessions policies
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions" 
ON public.user_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update existing table policies to use org-based access control

-- Policies table - organization isolation
DROP POLICY IF EXISTS "Users can manage their organization's policies" ON public.policies;
DROP POLICY IF EXISTS "Users can view their organization's policies" ON public.policies;

CREATE POLICY "Customers can view their own policies" 
ON public.policies FOR SELECT 
USING (has_role('customer') AND auth.uid() = customer_id);

CREATE POLICY "Agents can view policies they created" 
ON public.policies FOR SELECT 
USING (has_role('agent') AND auth.uid() = agent_id);

CREATE POLICY "Employees can manage org policies" 
ON public.policies FOR ALL 
USING (has_role('employee') AND is_same_org(org_id));

CREATE POLICY "Admins can manage org policies" 
ON public.policies FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all policies" 
ON public.policies FOR ALL 
USING (has_role('superadmin'));

-- Agents table - organization isolation
DROP POLICY IF EXISTS "Users can manage their organization's agents" ON public.agents;
DROP POLICY IF EXISTS "Users can view their organization's agents" ON public.agents;

CREATE POLICY "Agents can view their own profile" 
ON public.agents FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Employees can manage org agents" 
ON public.agents FOR ALL 
USING (has_role('employee') AND is_same_org(org_id));

CREATE POLICY "Admins can manage org agents" 
ON public.agents FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all agents" 
ON public.agents FOR ALL 
USING (has_role('superadmin'));

-- Customers table - organization isolation
DROP POLICY IF EXISTS "Users can manage their organization's customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their organization's customers" ON public.customers;

CREATE POLICY "Customers can view their own profile" 
ON public.customers FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Employees can manage org customers" 
ON public.customers FOR ALL 
USING ((has_role('employee') OR has_role('agent')) AND is_same_org(org_id));

CREATE POLICY "Admins can manage org customers" 
ON public.customers FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all customers" 
ON public.customers FOR ALL 
USING (has_role('superadmin'));

-- Employees table - organization isolation
DROP POLICY IF EXISTS "Users can manage their organization's employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view their organization's employees" ON public.employees;

CREATE POLICY "Employees can view their own profile" 
ON public.employees FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can manage org employees" 
ON public.employees FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all employees" 
ON public.employees FOR ALL 
USING (has_role('superadmin'));

-- Commission grids - organization isolation
CREATE POLICY "Org users can view org grids" 
ON public.motor_payout_grid FOR SELECT 
USING (is_same_org(org_id) OR has_role('superadmin'));

CREATE POLICY "Admins can manage org grids" 
ON public.motor_payout_grid FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all grids" 
ON public.motor_payout_grid FOR ALL 
USING (has_role('superadmin'));

-- Apply similar policies to other payout grids
CREATE POLICY "Org users can view org health grids" 
ON public.health_payout_grid FOR SELECT 
USING (is_same_org(org_id) OR has_role('superadmin'));

CREATE POLICY "Admins can manage org health grids" 
ON public.health_payout_grid FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all health grids" 
ON public.health_payout_grid FOR ALL 
USING (has_role('superadmin'));

CREATE POLICY "Org users can view org life grids" 
ON public.life_payout_grid FOR SELECT 
USING (is_same_org(org_id) OR has_role('superadmin'));

CREATE POLICY "Admins can manage org life grids" 
ON public.life_payout_grid FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all life grids" 
ON public.life_payout_grid FOR ALL 
USING (has_role('superadmin'));

-- Policy commissions - organization isolation
CREATE POLICY "Agents can view their own commissions" 
ON public.policy_commissions FOR SELECT 
USING (
  has_role('agent') AND 
  policy_id IN (SELECT id FROM policies WHERE agent_id = auth.uid())
);

CREATE POLICY "Org users can view org commissions" 
ON public.policy_commissions FOR SELECT 
USING ((has_role('employee') OR has_role('admin')) AND is_same_org(org_id));

CREATE POLICY "Admins can manage org commissions" 
ON public.policy_commissions FOR ALL 
USING (has_role('admin') AND is_same_org(org_id));

CREATE POLICY "Super admins can manage all commissions" 
ON public.policy_commissions FOR ALL 
USING (has_role('superadmin'));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, org_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    (NEW.raw_user_meta_data->>'org_id')::UUID
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();