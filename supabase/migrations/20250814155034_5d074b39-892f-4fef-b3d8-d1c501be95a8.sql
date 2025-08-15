-- Create master_plan_types table
CREATE TABLE public.master_plan_types (
  plan_type_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lob_id UUID NOT NULL REFERENCES public.master_line_of_business(lob_id),
  plan_type_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.master_plan_types ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read
CREATE POLICY "Allow authenticated users to read plan types" 
ON public.master_plan_types 
FOR SELECT 
USING (true);

-- Create policies for system admins to manage
CREATE POLICY "System admins can manage plan types" 
ON public.master_plan_types 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_master_plan_types_updated_at
BEFORE UPDATE ON public.master_plan_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.master_plan_types (lob_id, plan_type_name, description, is_active) VALUES
-- Health Insurance plans
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'HEALTH' LIMIT 1), 'Individual Health Plan', 'Health insurance coverage for a single individual', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'HEALTH' LIMIT 1), 'Family Floater Plan', 'Health insurance coverage for entire family under one sum insured', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'HEALTH' LIMIT 1), 'Senior Citizen Plan', 'Specialized health insurance for senior citizens', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'HEALTH' LIMIT 1), 'Critical Illness Plan', 'Coverage for critical illnesses like cancer, heart attack', true),
-- Motor Insurance plans  
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'MOTOR' LIMIT 1), 'Third Party Liability Only', 'Mandatory third party liability coverage', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'MOTOR' LIMIT 1), 'Comprehensive Plan', 'Complete motor insurance with own damage and third party coverage', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'MOTOR' LIMIT 1), 'Own Damage Only', 'Coverage for own vehicle damage only', true),
-- Life Insurance plans
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'LIFE' LIMIT 1), 'Term Life Plan', 'Pure life insurance coverage for specified term', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'LIFE' LIMIT 1), 'Whole Life Plan', 'Life insurance with savings component', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'LIFE' LIMIT 1), 'Endowment Plan', 'Life insurance with guaranteed returns', true),
((SELECT lob_id FROM public.master_line_of_business WHERE lob_code = 'LIFE' LIMIT 1), 'ULIP Plan', 'Unit Linked Insurance Plan with investment options', true);