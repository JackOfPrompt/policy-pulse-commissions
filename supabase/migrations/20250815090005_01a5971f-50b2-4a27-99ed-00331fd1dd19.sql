-- Enable RLS on master_departments table
ALTER TABLE public.master_departments ENABLE ROW LEVEL SECURITY;

-- Create policies for master_departments table
CREATE POLICY "Allow authenticated users to read departments" 
ON public.master_departments 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage departments" 
ON public.master_departments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'::app_role
  )
);

-- Add triggers for updated_at timestamp
CREATE TRIGGER update_master_departments_updated_at
    BEFORE UPDATE ON public.master_departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();