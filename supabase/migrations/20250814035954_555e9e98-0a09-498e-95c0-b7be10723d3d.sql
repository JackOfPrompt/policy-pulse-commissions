-- Fix the remaining function without search_path
CREATE OR REPLACE FUNCTION create_system_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Generate a UUID for the system admin
  admin_user_id := gen_random_uuid();
  
  -- Insert system admin profile
  INSERT INTO public.profiles (
    id,
    user_id, 
    email, 
    first_name, 
    last_name, 
    role,
    must_change_password,
    password_changed_at
  ) VALUES (
    gen_random_uuid(),
    admin_user_id,
    'system@admin.com',
    'System',
    'Administrator', 
    'system_admin',
    false,
    now()
  ) ON CONFLICT (user_id) DO NOTHING;
END;
$$;