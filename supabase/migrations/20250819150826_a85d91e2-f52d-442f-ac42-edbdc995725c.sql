-- Fix tables with RLS enabled but no policies (corrected)

-- Add policies for premiums table (has tenant_id as bigint)
CREATE POLICY "Tenant users can access their premiums" ON public.premiums
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND (profiles.tenant_id::text = premiums.tenant_id::text OR profiles.role = 'system_admin')
  )
);

-- Add policies for premium_adjustments table (doesn't have tenant_id, link through premiums)
CREATE POLICY "Users can access premium adjustments for their premiums" ON public.premium_adjustments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN premiums pr ON pr.premium_id = premium_adjustments.premium_id
    WHERE p.user_id = auth.uid() 
    AND (p.tenant_id::text = pr.tenant_id::text OR p.role = 'system_admin')
  )
);

-- Add policies for revenue_allocation table (no direct tenant link, access via org_id)
CREATE POLICY "Users can access revenue allocation data" ON public.revenue_allocation
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
  )
);