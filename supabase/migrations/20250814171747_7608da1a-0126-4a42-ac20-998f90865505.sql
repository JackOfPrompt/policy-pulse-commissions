-- Enable Row Level Security on master_premium_types table
ALTER TABLE public.master_premium_types ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read premium types
CREATE POLICY "Allow authenticated users to read premium types" 
ON public.master_premium_types 
FOR SELECT 
USING (true);

-- System admins can manage premium types
CREATE POLICY "System admins can manage premium types" 
ON public.master_premium_types 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'system_admin'::app_role
  )
);