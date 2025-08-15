-- Drop views first
DROP VIEW IF EXISTS public.master_cities_view CASCADE;
DROP VIEW IF EXISTS public.master_pincodes_view CASCADE;

-- Drop tables
DROP TABLE IF EXISTS public.master_pincodes CASCADE;
DROP TABLE IF EXISTS public.master_cities CASCADE;
DROP TABLE IF EXISTS public.master_states CASCADE;
DROP TABLE IF EXISTS public.master_countries CASCADE;