-- Enable RLS on master_vehicle_types table
ALTER TABLE public.master_vehicle_types ENABLE ROW LEVEL SECURITY;

-- Create policies for master_vehicle_types
CREATE POLICY "Allow authenticated users to read vehicle types" 
ON public.master_vehicle_types 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System admins can manage vehicle types" 
ON public.master_vehicle_types 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);

-- Enable RLS on master_vehicle_data table
ALTER TABLE public.master_vehicle_data ENABLE ROW LEVEL SECURITY;

-- Create policies for master_vehicle_data
CREATE POLICY "Allow authenticated users to read vehicle data" 
ON public.master_vehicle_data 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System admins can manage vehicle data" 
ON public.master_vehicle_data 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);

-- Enable RLS on master_premium_terms table
ALTER TABLE public.master_premium_terms ENABLE ROW LEVEL SECURITY;

-- Create policies for master_premium_terms
CREATE POLICY "Allow authenticated users to read premium terms" 
ON public.master_premium_terms 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System admins can manage premium terms" 
ON public.master_premium_terms 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);