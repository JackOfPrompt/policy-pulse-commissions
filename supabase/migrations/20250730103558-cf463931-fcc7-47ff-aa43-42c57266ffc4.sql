-- Remove enum constraint from line_of_business table to allow custom LOB names
-- First, change the name column from enum to text
ALTER TABLE public.line_of_business 
ALTER COLUMN name TYPE text;