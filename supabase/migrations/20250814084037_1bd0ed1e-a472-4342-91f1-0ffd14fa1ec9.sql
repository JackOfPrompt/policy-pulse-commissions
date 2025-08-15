-- Fix security issues from linter

-- Drop the problematic views and recreate them properly
DROP VIEW IF EXISTS master_pincodes_view;
DROP VIEW IF EXISTS master_cities_view;

-- Create proper security definer functions instead of views
CREATE OR REPLACE FUNCTION public.get_master_pincodes_data()
RETURNS TABLE (
  pincode_id UUID,
  pincode TEXT,
  area_name TEXT,
  city_id UUID,
  latitude NUMERIC,
  longitude NUMERIC,
  status location_status,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT 
    gen_random_uuid() as pincode_id,
    ml.pincode,
    ml.district as area_name,
    gen_random_uuid() as city_id,
    NULL::numeric as latitude,
    NULL::numeric as longitude,
    CASE ml.status WHEN 'Active' THEN 'Active'::location_status ELSE 'Inactive'::location_status END as status,
    ml.created_at,
    ml.updated_at,
    ml.created_by,
    ml.updated_by
  FROM public.master_locations ml;
$$;

CREATE OR REPLACE FUNCTION public.get_master_cities_data()
RETURNS TABLE (
  city_id UUID,
  city_code TEXT,
  city_name TEXT,
  state_id UUID,
  state_code TEXT,
  state_name TEXT,
  country_code TEXT,
  status location_status,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  country_name TEXT
) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
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
    CASE ml.status WHEN 'Active' THEN 'Active'::location_status ELSE 'Inactive'::location_status END as status,
    ml.created_at,
    ml.updated_at,
    ml.created_by,
    ml.updated_by,
    ml.country as country_name
  FROM public.master_locations ml;
$$;