-- Drop percentage column from agents table
ALTER TABLE public.agents 
DROP COLUMN IF EXISTS percentage;