-- Disable Row Level Security for motor policy tables that exist

-- Disable RLS on existing motor policy related tables
ALTER TABLE public.motor_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_vehicle_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_vehicle_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_motor_vehicle_types DISABLE ROW LEVEL SECURITY;