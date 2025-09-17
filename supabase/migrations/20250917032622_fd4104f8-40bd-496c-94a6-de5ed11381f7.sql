-- Add missing columns to revenue_table for commission distribution
ALTER TABLE public.revenue_table 
ADD COLUMN IF NOT EXISTS misp_commission NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reporting_employee_commission NUMERIC DEFAULT 0;