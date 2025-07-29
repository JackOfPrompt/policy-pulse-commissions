-- Fix RLS policies for insurance_products table to allow bulk uploads
-- Drop the restrictive admin-only policy 
DROP POLICY IF EXISTS "Admins can manage all insurance products" ON public.insurance_products;

-- Create a more permissive policy for insurance products
CREATE POLICY "Anyone can manage insurance products"
ON public.insurance_products
FOR ALL
TO public
USING (true)
WITH CHECK (true);