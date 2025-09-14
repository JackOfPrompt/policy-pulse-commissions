-- Enhance organizations table with richer data fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
ADD COLUMN IF NOT EXISTS longitude numeric(9,6),
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for organization logos
CREATE POLICY IF NOT EXISTS "Organization logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'organization-logos');

CREATE POLICY IF NOT EXISTS "Super admins can upload organization logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'organization-logos' AND (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
));

CREATE POLICY IF NOT EXISTS "Super admins can update organization logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'organization-logos' AND (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
));

CREATE POLICY IF NOT EXISTS "Super admins can delete organization logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'organization-logos' AND (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
));