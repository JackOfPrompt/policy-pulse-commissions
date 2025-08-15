-- Create master_health_conditions table
CREATE TABLE public.master_health_conditions (
    condition_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('Covered', 'Exclusions')),
    condition_name TEXT NOT NULL,
    description TEXT,
    waiting_period TEXT, -- e.g., '2 years', 'After 3 years', NULL if not applicable
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.master_health_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies for health conditions
CREATE POLICY "Allow authenticated users to read health conditions" 
ON public.master_health_conditions 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage health conditions" 
ON public.master_health_conditions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'system_admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_health_conditions_updated_at
BEFORE UPDATE ON public.master_health_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Covered Conditions
INSERT INTO public.master_health_conditions (category, condition_name, description, waiting_period) VALUES
('Covered', 'Pre-existing Diseases', 'Covered after specific waiting period', '2-4 years'),
('Covered', 'Diabetes Care', 'Covers diabetes treatment after waiting period', '2 years'),
('Covered', 'Hypertension Care', 'Covers hypertension treatment after waiting period', '2 years'),
('Covered', 'Cancer Cover', 'Treatment for cancer included', NULL),
('Covered', 'Cardiac Care', 'Covers heart-related treatments', NULL),
('Covered', 'Kidney Disorder Cover', 'Coverage for kidney disorders', NULL),
('Covered', 'Maternity & Newborn', 'Maternity and newborn care', '3 years'),
('Covered', 'Mental Health', 'Covers psychiatric and mental health treatments', NULL),
('Covered', 'HIV/AIDS Cover', 'Covers treatment for HIV/AIDS', NULL),
('Covered', 'Cosmetic Surgery (accidental only)', 'Covers cosmetic surgery only if caused by accident', NULL),
('Covered', 'Organ Transplant', 'Coverage for organ transplant procedures', NULL);

-- Insert Exclusions
INSERT INTO public.master_health_conditions (category, condition_name, description) VALUES
('Exclusions', 'Pre-existing Diseases (before waiting)', 'Not covered before specified waiting period'),
('Exclusions', 'Self-inflicted Injuries', 'Injuries caused by intentional self-harm'),
('Exclusions', 'Cosmetic Treatment', 'Non-accidental cosmetic treatments not covered'),
('Exclusions', 'Dental (non-accidental)', 'Dental care not covered unless caused by accident'),
('Exclusions', 'Fertility Treatments', 'Not covered under any circumstances'),
('Exclusions', 'Experimental Treatments', 'Unproven or experimental treatments not covered'),
('Exclusions', 'War & Terrorism Injuries', 'Injuries due to war or terrorism excluded'),
('Exclusions', 'Substance Abuse', 'Treatment for alcohol or drug abuse not covered'),
('Exclusions', 'OPD unless covered', 'Outpatient treatments not covered unless explicitly included');