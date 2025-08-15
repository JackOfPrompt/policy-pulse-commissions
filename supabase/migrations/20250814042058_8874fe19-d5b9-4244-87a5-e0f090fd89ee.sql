-- Add missing RLS policies for user_credentials table only
CREATE POLICY "Users can view their own credentials" 
ON user_credentials 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "System admins can view all credentials" 
ON user_credentials 
FOR SELECT 
USING (public.has_role(auth.uid(), 'system_admin'));