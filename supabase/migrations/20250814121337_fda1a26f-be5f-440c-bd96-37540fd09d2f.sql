-- Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.master_insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_line_of_business ENABLE ROW LEVEL SECURITY;