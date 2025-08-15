-- Make the block field nullable in master_locations table
ALTER TABLE public.master_locations 
ALTER COLUMN block DROP NOT NULL;