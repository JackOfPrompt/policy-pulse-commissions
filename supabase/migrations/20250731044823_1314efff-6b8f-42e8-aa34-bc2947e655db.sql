-- Create user profiles table for role-based access (without sample data)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('Employee', 'Agent', 'Customer')),
  employee_role TEXT CHECK (employee_role IN ('Admin', 'Sales', 'Ops', 'Branch Manager', 'Finance')),
  agent_type TEXT CHECK (agent_type IN ('MISP', 'POSP')),
  branch_id UUID REFERENCES public.branches(id),
  date_of_joining DATE,
  registration_date DATE DEFAULT CURRENT_DATE,
  kyc_status TEXT DEFAULT 'Pending' CHECK (kyc_status IN ('Pending', 'Verified', 'Rejected')),
  kyc_document_path TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.user_type = 'Employee' 
      AND p.employee_role = 'Admin'
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    user_type,
    phone
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'Customer'),
    NEW.phone
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user profile with role info
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  user_type TEXT,
  employee_role TEXT,
  agent_type TEXT,
  branch_name TEXT,
  is_active BOOLEAN,
  kyc_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.email,
    p.phone,
    p.full_name,
    p.user_type,
    p.employee_role,
    p.agent_type,
    b.name as branch_name,
    p.is_active,
    p.kyc_status
  FROM profiles p
  LEFT JOIN branches b ON p.branch_id = b.id
  WHERE p.id = user_id;
$$;