-- Fix RLS policies to allow authenticated users to perform bulk operations
-- Add policy for authenticated users to insert insurance providers during bulk uploads

-- First, check if we need to create a more permissive policy for bulk operations
CREATE POLICY "Authenticated users can insert providers"
ON public.insurance_providers
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also add update permission for authenticated users
CREATE POLICY "Authenticated users can update providers"
ON public.insurance_providers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add select permission for authenticated users
CREATE POLICY "Authenticated users can select providers"
ON public.insurance_providers
FOR SELECT
TO authenticated
USING (true);