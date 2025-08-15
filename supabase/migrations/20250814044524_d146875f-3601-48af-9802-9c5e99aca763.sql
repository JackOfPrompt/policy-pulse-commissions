-- Add foreign key relationship between user_credentials and profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_credentials(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Update RLS policies to allow user credentials manipulation by system admins
CREATE POLICY "System admins can manage user credentials" 
ON public.user_credentials 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'system_admin'
));

CREATE POLICY "System admins can insert user credentials" 
ON public.user_credentials 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'system_admin'
));

CREATE POLICY "System admins can update user credentials" 
ON public.user_credentials 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'system_admin'
));

-- Allow users to update their own password hash
CREATE POLICY "Users can update their own password" 
ON public.user_credentials 
FOR UPDATE 
USING (id = auth.uid());