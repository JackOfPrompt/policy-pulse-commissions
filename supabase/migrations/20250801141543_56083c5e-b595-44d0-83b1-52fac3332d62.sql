-- Disable RLS for master_cities table
ALTER TABLE public.master_cities DISABLE ROW LEVEL SECURITY;

-- Disable RLS for master_pincodes table (if it exists)
ALTER TABLE public.master_pincodes DISABLE ROW LEVEL SECURITY;