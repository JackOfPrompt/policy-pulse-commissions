-- Disable Row Level Security for motor policy tables

-- Disable RLS on motor policy related tables
ALTER TABLE public.motor_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_vehicle_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_makes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_variants DISABLE ROW LEVEL SECURITY;