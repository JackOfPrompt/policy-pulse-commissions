-- Allow reading profiles during authentication by matching with user_credentials
CREATE POLICY "Allow reading profiles for authentication" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_credentials 
    WHERE user_credentials.id = profiles.user_id 
    AND user_credentials.is_active = true
  )
);