-- Remove all data from master_cities table (includes city and pincode data)
DELETE FROM public.master_cities;

-- Reset any sequences if needed
-- Note: master_cities uses UUID primary keys, so no sequence reset needed