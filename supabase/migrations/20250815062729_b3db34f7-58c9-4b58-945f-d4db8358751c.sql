-- Create master_occupations table
CREATE TABLE public.master_occupations (
  occupation_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text,
  description text,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraints
ALTER TABLE public.master_occupations ADD CONSTRAINT master_occupations_name_key UNIQUE (name);
ALTER TABLE public.master_occupations ADD CONSTRAINT master_occupations_code_key UNIQUE (code);

-- Enable Row Level Security
ALTER TABLE public.master_occupations ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read
CREATE POLICY "Allow authenticated users to read occupations" 
ON public.master_occupations 
FOR SELECT 
USING (true);

-- Create policies for system admins to manage
CREATE POLICY "System admins can manage occupations" 
ON public.master_occupations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'system_admin'
));

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_master_occupations_updated_at
BEFORE UPDATE ON public.master_occupations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();