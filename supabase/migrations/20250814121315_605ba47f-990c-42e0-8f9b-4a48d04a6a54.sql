-- Enable RLS on all public tables that need it
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
DROP FUNCTION IF EXISTS public.auto_deactivate_pincodes();
CREATE OR REPLACE FUNCTION public.auto_deactivate_pincodes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If city status changes to Inactive, deactivate all linked pincodes
  IF NEW.status = 'Inactive' AND OLD.status = 'Active' THEN
    UPDATE public.master_pincodes 
    SET status = 'Inactive', updated_at = now()
    WHERE city_id = NEW.city_id AND status = 'Active';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix search path for get_master_pincodes_data function
DROP FUNCTION IF EXISTS public.get_master_pincodes_data();
CREATE OR REPLACE FUNCTION public.get_master_pincodes_data()
RETURNS TABLE(pincode_id uuid, pincode text, area_name text, city_id uuid, latitude numeric, longitude numeric, status text, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid, updated_by uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    gen_random_uuid() as pincode_id,
    ml.pincode,
    ml.district as area_name,
    gen_random_uuid() as city_id,
    NULL::numeric as latitude,
    NULL::numeric as longitude,
    ml.status,
    ml.created_at,
    ml.updated_at,
    ml.created_by,
    ml.updated_by
  FROM public.master_locations ml;
$$;

-- Fix search path for get_master_cities_data function
DROP FUNCTION IF EXISTS public.get_master_cities_data();
CREATE OR REPLACE FUNCTION public.get_master_cities_data()
RETURNS TABLE(city_id uuid, city_code text, city_name text, state_id uuid, state_code text, state_name text, country_code text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid, updated_by uuid, country_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT
    gen_random_uuid() as city_id,
    LEFT(ml.district, 10) as city_code,
    ml.district as city_name,
    gen_random_uuid() as state_id,
    LEFT(ml.state, 3) as state_code,
    ml.state as state_name,
    LEFT(ml.country, 1) as country_code,
    ml.status,
    ml.created_at,
    ml.updated_at,
    ml.created_by,
    ml.updated_by,
    ml.country as country_name
  FROM public.master_locations ml;
$$;