-- Fix tables with RLS enabled but no policies

-- Add policies for premiums table
CREATE POLICY "Tenant users can access their premiums" ON public.premiums
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (tenant_id::text = premiums.tenant_id::text OR role = 'system_admin')
  )
);

-- Add policies for premium_adjustments table  
CREATE POLICY "Tenant users can access their premium adjustments" ON public.premium_adjustments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (tenant_id::text = premium_adjustments.tenant_id::text OR role = 'system_admin')
  )
);

-- Add policies for revenue_allocation table
CREATE POLICY "Tenant users can access their revenue allocation" ON public.revenue_allocation
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (tenant_id::text = revenue_allocation.tenant_id::text OR role = 'system_admin')
  )
);