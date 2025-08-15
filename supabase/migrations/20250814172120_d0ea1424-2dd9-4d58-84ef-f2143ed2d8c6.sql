-- Create master_premium_terms table
CREATE TABLE public.master_premium_terms (
  premium_term_id SERIAL PRIMARY KEY,
  premium_term_name VARCHAR(50) NOT NULL,
  premium_term_code VARCHAR(10) NOT NULL UNIQUE,
  term_duration_years INTEGER NOT NULL CHECK (term_duration_years > 0),
  description VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_premium_terms_status ON public.master_premium_terms(status);
CREATE INDEX idx_premium_terms_code ON public.master_premium_terms(premium_term_code);

-- Add trigger for updated_at
CREATE TRIGGER update_premium_terms_updated_at
  BEFORE UPDATE ON public.master_premium_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.master_premium_terms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read premium terms" 
ON public.master_premium_terms 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage premium terms" 
ON public.master_premium_terms 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'system_admin'::app_role
  )
);

-- Insert sample data
INSERT INTO public.master_premium_terms (premium_term_name, premium_term_code, term_duration_years, description) VALUES
('1 Year', '1Y', 1, 'Single year premium payment term'),
('3 Years', '3Y', 3, 'Three year premium payment term'),
('5 Years', '5Y', 5, 'Five year premium payment term'),
('10 Years', '10Y', 10, 'Ten year premium payment term'),
('15 Years', '15Y', 15, 'Fifteen year premium payment term'),
('20 Years', '20Y', 20, 'Twenty year premium payment term');