-- Fix infinite recursion issues in RLS policies by using security definer functions

-- Create a security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Create function to check if user is admin safely
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Create function to get current user's employee record
CREATE OR REPLACE FUNCTION public.get_current_user_employee()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT e.id 
  FROM public.employees e 
  WHERE e.user_id = auth.uid() 
  LIMIT 1;
$$;

-- Create function to get current user's agent record  
CREATE OR REPLACE FUNCTION public.get_current_user_agent()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT a.id 
  FROM public.agents a 
  WHERE a.user_id = auth.uid() 
  LIMIT 1;
$$;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update profiles policies to use security definer functions
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Admin can manage all profiles" ON public.profiles
FOR ALL USING (public.is_current_user_admin());

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles  
FOR UPDATE USING (id = auth.uid());