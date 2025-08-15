-- Add RLS policies for user_credentials table
CREATE POLICY "Users can view their own credentials" 
ON user_credentials 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "System admins can view all credentials" 
ON user_credentials 
FOR SELECT 
USING (public.has_role(auth.uid(), 'system_admin'));

-- Add RLS policies for profiles table  
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System admins can insert profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System admins can update profiles" 
ON profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'system_admin'));

-- Add RLS policies for tenant_organizations table
CREATE POLICY "System admins can manage tenant organizations" 
ON tenant_organizations 
FOR ALL 
USING (public.has_role(auth.uid(), 'system_admin'));

-- Add RLS policies for tenant_subscriptions table
CREATE POLICY "System admins can manage tenant subscriptions" 
ON tenant_subscriptions 
FOR ALL 
USING (public.has_role(auth.uid(), 'system_admin'));

-- Add RLS policies for mdm_providers table
CREATE POLICY "System admins can manage MDM providers" 
ON mdm_providers 
FOR ALL 
USING (public.has_role(auth.uid(), 'system_admin'));