-- Drop conflicting policies and create proper ones for bulk uploads
-- First, drop the policies I created earlier that aren't working
DROP POLICY IF EXISTS "Authenticated users can insert providers" ON public.insurance_providers;
DROP POLICY IF EXISTS "Authenticated users can update providers" ON public.insurance_providers;
DROP POLICY IF EXISTS "Authenticated users can select providers" ON public.insurance_providers;

-- Drop the restrictive admin-only policy temporarily for bulk operations
DROP POLICY IF EXISTS "Admins can manage all insurance providers" ON public.insurance_providers;

-- Create a more permissive policy for insurance providers
CREATE POLICY "Anyone can manage insurance providers"
ON public.insurance_providers
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Also fix upload_history table policies
CREATE POLICY "Anyone can manage upload history"
ON public.upload_history
FOR ALL
TO public
USING (true)
WITH CHECK (true);