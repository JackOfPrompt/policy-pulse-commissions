-- Drop legacy tables no longer used after refactor
DROP TABLE IF EXISTS public.product_providers CASCADE;
DROP TABLE IF EXISTS public.provider_line_of_business CASCADE;
DROP TABLE IF EXISTS public.product_motor_vehicle_types CASCADE;