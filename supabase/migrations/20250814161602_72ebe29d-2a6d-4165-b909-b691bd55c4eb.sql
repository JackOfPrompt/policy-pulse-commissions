-- Enable RLS on master_premium_frequency table
ALTER TABLE public.master_premium_frequency ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_premium_frequency
CREATE POLICY "Allow authenticated users to read premium frequencies" 
ON public.master_premium_frequency 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage premium frequencies" 
ON public.master_premium_frequency 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);