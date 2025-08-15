-- Enable RLS on master_relationship_codes table
ALTER TABLE public.master_relationship_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for master_relationship_codes
CREATE POLICY "Allow authenticated users to read relationship codes" 
ON public.master_relationship_codes 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System admins can manage relationship codes" 
ON public.master_relationship_codes 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);