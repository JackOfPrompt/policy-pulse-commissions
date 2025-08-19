-- Fix the functions with correct search_path, taking it step by step

-- First fix remaining simple functions  
CREATE OR REPLACE FUNCTION public.update_tenant_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    phone,
    first_name,
    last_name,
    role,
    must_change_password
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'customer'::app_role),
    COALESCE((NEW.raw_user_meta_data ->> 'must_change_password')::boolean, false)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_status_master_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$;