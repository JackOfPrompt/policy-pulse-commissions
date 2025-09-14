-- Create user_organizations table for tenant-specific roles
CREATE TABLE public.user_organizations (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'superadmin', 'admin', 'agent', 'employee', 'customer'
  PRIMARY KEY (user_id, org_id)
);

-- Enable RLS on user_organizations
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_organizations
CREATE POLICY "Super admins can manage user organizations" 
ON public.user_organizations 
FOR ALL 
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Users can view their organization memberships" 
ON public.user_organizations 
FOR SELECT 
USING (user_id = auth.uid());

-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_organizations
    WHERE user_id = auth.uid()
      AND role = 'superadmin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Update profiles trigger to handle role from user_organizations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, email, role, org_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    (NEW.raw_user_meta_data->>'org_id')::UUID
  );
  
  -- Insert into user_organizations if org_id and role are provided
  IF NEW.raw_user_meta_data->>'org_id' IS NOT NULL AND NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_organizations (user_id, org_id, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'org_id')::UUID,
      NEW.raw_user_meta_data->>'role'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;