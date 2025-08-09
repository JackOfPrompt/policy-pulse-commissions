-- Enable RLS on master_cities table and fix related issues
ALTER TABLE public.master_cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_cities
CREATE POLICY "Admin can manage master cities" 
ON public.master_cities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "All can view master cities" 
ON public.master_cities 
FOR SELECT 
USING (is_active = true);