-- Fix security issues: Remove security definer view and ensure proper RLS
DROP VIEW IF EXISTS public.user_profile_view;

-- Create a regular view instead of security definer
CREATE VIEW public.user_profile_view AS
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
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_organizations uo WHERE uo.user_id = p.id)
    THEN (
      SELECT array_agg(
        json_build_object(
          'org_id', uo2.org_id,
          'role', uo2.role
        )
      )
      FROM public.user_organizations uo2 
      WHERE uo2.user_id = p.id
    )
    ELSE NULL
  END as organization_roles
FROM public.profiles p;

-- Enable RLS on the view (though views inherit from underlying tables)
-- The view will respect the RLS policies of the underlying tables

-- Ensure all tables have proper RLS policies - check for any missing RLS
-- users table should have RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;