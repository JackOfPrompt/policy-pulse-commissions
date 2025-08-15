-- Add missing RLS policies for user_credentials table
CREATE POLICY "Users can view their own credentials" 
ON user_credentials 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "System admins can view all credentials" 
ON user_credentials 
FOR SELECT 
USING (public.has_role(auth.uid(), 'system_admin'));

-- Add missing RLS policies for mdm_providers table
CREATE POLICY "System admins can manage MDM providers" 
ON mdm_providers 
FOR ALL 
USING (public.has_role(auth.uid(), 'system_admin'));