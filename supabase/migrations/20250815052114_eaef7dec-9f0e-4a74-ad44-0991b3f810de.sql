-- Enable Row Level Security for master_business_categories
ALTER TABLE public.master_business_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read business categories
CREATE POLICY "Allow authenticated users to read business categories" 
ON public.master_business_categories 
FOR SELECT 
USING (true);

-- Create policies for system admins to manage business categories
CREATE POLICY "System admins can manage business categories" 
ON public.master_business_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);