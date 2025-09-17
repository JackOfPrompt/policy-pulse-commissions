-- Create the missing providers table that the commission calculation function references
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  provider_type text,
  is_active boolean DEFAULT true,
  org_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for providers table
CREATE POLICY "Users can view their org providers" 
ON public.providers 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations 
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Admins can manage their org providers" 
ON public.providers 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations 
  WHERE user_organizations.user_id = auth.uid() 
  AND user_organizations.role IN ('admin', 'superadmin')
))
WITH CHECK (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations 
  WHERE user_organizations.user_id = auth.uid() 
  AND user_organizations.role IN ('admin', 'superadmin')
));

-- Insert some common providers for organizations (they can add more)
INSERT INTO public.providers (name, code, provider_type, org_id)
SELECT 
  provider_name,
  UPPER(REPLACE(provider_name, ' ', '_')),
  'insurance',
  org.id
FROM (
  VALUES 
    ('HDFC ERGO'),
    ('ICICI Lombard'),
    ('Bajaj Allianz'),
    ('New India Assurance'),
    ('Oriental Insurance'),
    ('United India Insurance'),
    ('National Insurance'),
    ('IFFCO Tokio'),
    ('Cholamandalam MS'),
    ('Future Generali'),
    ('Reliance General'),
    ('Tata AIG'),
    ('Royal Sundaram'),
    ('SBI General'),
    ('Bharti AXA'),
    ('Kotak Mahindra'),
    ('Digit Insurance'),
    ('Go Digit'),
    ('Acko Insurance'),
    ('Liberty General')
) AS provider_data(provider_name)
CROSS JOIN (SELECT id FROM public.organizations LIMIT 100) AS org
ON CONFLICT (code) DO NOTHING;