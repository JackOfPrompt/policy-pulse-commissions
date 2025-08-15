-- Enable RLS on storage.objects table (this is required for storage policies to work)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Also enable RLS on storage.buckets if not already enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get current user role (to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;