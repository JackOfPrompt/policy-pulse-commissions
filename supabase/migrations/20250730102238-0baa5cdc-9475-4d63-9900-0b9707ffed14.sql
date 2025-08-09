-- Drop all existing storage policies and create permissive ones for all buckets
-- This will allow unrestricted access to storage buckets

-- First, drop existing policies (if any) for all buckets
DROP POLICY IF EXISTS "Authenticated users can upload provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update provider documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view provider documents" ON storage.objects;

-- Create permissive policies that allow all operations for all buckets
CREATE POLICY "Allow all operations on provider-documents" 
ON storage.objects 
FOR ALL 
TO public 
USING (bucket_id = 'provider-documents');

CREATE POLICY "Allow all operations on product-brochures" 
ON storage.objects 
FOR ALL 
TO public 
USING (bucket_id = 'product-brochures');

CREATE POLICY "Allow all operations on agent-documents" 
ON storage.objects 
FOR ALL 
TO public 
USING (bucket_id = 'agent-documents');

CREATE POLICY "Allow all operations on employee-documents" 
ON storage.objects 
FOR ALL 
TO public 
USING (bucket_id = 'employee-documents');