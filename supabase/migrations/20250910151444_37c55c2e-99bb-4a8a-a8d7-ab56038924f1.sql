-- Create demo organizations if they don't exist
INSERT INTO public.organizations (name) VALUES 
    ('Global Corp'),
    ('Demo Insurance LLC')
ON CONFLICT (name) DO NOTHING;