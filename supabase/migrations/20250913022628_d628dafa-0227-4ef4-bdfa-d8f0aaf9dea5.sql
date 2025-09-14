-- Update profiles to work better with multi-tenant roles
-- Add a function to get user role for specific organization
CREATE OR REPLACE FUNCTION public.get_user_role_in_org(user_uuid UUID, organization_id UUID)
RETURNS TEXT AS $$
  SELECT role 
  FROM public.user_organizations 
  WHERE user_id = user_uuid AND org_id = organization_id
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Add a function to check if user has role in any organization
CREATE OR REPLACE FUNCTION public.user_has_role_in_any_org(user_uuid UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_organizations 
    WHERE user_id = user_uuid AND role = check_role
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Update the profiles table to include a primary_org_id for default organization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_org_id UUID;

-- Create a function to sync profile role with user_organizations
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile role to match the primary organization role
  UPDATE public.profiles 
  SET role = NEW.role,
      primary_org_id = NEW.org_id
  WHERE id = NEW.user_id 
    AND (primary_org_id = NEW.org_id OR primary_org_id IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to sync roles
CREATE OR REPLACE TRIGGER sync_profile_role_trigger
  AFTER INSERT OR UPDATE ON public.user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role();

-- Create a view for easier user management
CREATE OR REPLACE VIEW public.user_profile_view AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.department,
  p.sub_department,
  p.role as primary_role,
  p.org_id as primary_org_id,
  p.created_at,
  p.updated_at,
  array_agg(
    json_build_object(
      'org_id', uo.org_id,
      'role', uo.role
    )
  ) FILTER (WHERE uo.org_id IS NOT NULL) as organization_roles
FROM public.profiles p
LEFT JOIN public.user_organizations uo ON p.id = uo.user_id
GROUP BY p.id, p.full_name, p.email, p.department, p.sub_department, p.role, p.org_id, p.created_at, p.updated_at;