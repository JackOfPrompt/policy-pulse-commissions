-- Create providers table if not exists
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  provider_type text NOT NULL DEFAULT 'insurer',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create org_config table for organization-level settings
CREATE TABLE IF NOT EXISTS public.org_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_share_percentage numeric DEFAULT 60,
  broker_share_percentage numeric DEFAULT 40,
  default_commission_rate numeric DEFAULT 0,
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(org_id)
);

-- Add provider_id to commission_grids table
ALTER TABLE public.commission_grids 
ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.providers(id);

-- Add gross_premium column to policies if not exists
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS gross_premium numeric;

-- Insert default providers
INSERT INTO public.providers (name, code, provider_type) VALUES
('HDFC Life', 'HDFC_LIFE', 'life'),
('ICICI Lombard', 'ICICI_LOMBARD', 'motor'),
('Bajaj Allianz', 'BAJAJ_ALLIANZ', 'health'),
('Star Health', 'STAR_HEALTH', 'health'),
('New India Assurance', 'NEW_INDIA', 'motor'),
('LIC', 'LIC', 'life')
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for providers
CREATE POLICY "Anyone can view providers" ON public.providers
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage providers" ON public.providers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_organizations uo
    WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'superadmin')
  )
);

-- Create RLS policies for org_config
CREATE POLICY "Users can view their org config" ON public.org_config
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM public.user_organizations
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage their org config" ON public.org_config
FOR ALL USING (
  org_id IN (
    SELECT org_id FROM public.user_organizations
    WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Update commission calculation function to be provider-aware
CREATE OR REPLACE FUNCTION public.calculate_policy_commission_enhanced(p_policy_id uuid)
RETURNS TABLE(
  policy_id uuid,
  commission_rate numeric,
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  broker_share numeric,
  commission_status text,
  matched_grid_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  policy_rec record;
  grid_rec record;
  org_config_rec record;
  source_rec record;
  gross_premium numeric := 0;
  calculated_insurer_commission numeric := 0;
  calculated_agent_commission numeric := 0;
  calculated_misp_commission numeric := 0;
  calculated_employee_commission numeric := 0;
  calculated_broker_share numeric := 0;
  status text := 'calculated';
BEGIN
  -- Get policy details with provider and product type
  SELECT 
    p.*,
    pt.category as product_category,
    pt.name as product_name,
    c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name
  INTO policy_rec
  FROM policies p
  LEFT JOIN product_types pt ON pt.id = p.product_type_id
  LEFT JOIN customers c ON c.id = p.customer_id
  WHERE p.id = p_policy_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT p_policy_id, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 'policy_not_found'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Get gross premium (prefer gross_premium, fallback to premium_with_gst, then premium_without_gst)
  gross_premium := COALESCE(policy_rec.gross_premium, policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0);

  -- Get organization config
  SELECT * INTO org_config_rec
  FROM org_config
  WHERE org_id = policy_rec.org_id;

  -- Find matching commission grid by provider_id + product_type + premium range
  SELECT cg.*
  INTO grid_rec
  FROM commission_grids cg
  JOIN providers pr ON pr.id = cg.provider_id
  WHERE cg.org_id = policy_rec.org_id
    AND cg.product_type = policy_rec.product_category
    AND pr.code = policy_rec.provider
    AND (cg.min_premium IS NULL OR gross_premium >= cg.min_premium)
    AND (cg.max_premium IS NULL OR gross_premium <= cg.max_premium)
    AND CURRENT_DATE >= cg.effective_from
    AND (cg.effective_to IS NULL OR CURRENT_DATE <= cg.effective_to)
  ORDER BY cg.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- No matching grid found
    RETURN QUERY SELECT p_policy_id, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 'grid_mismatch'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Calculate base insurer commission
  calculated_insurer_commission := gross_premium * grid_rec.commission_rate / 100;

  -- Distribute commission based on source type
  IF policy_rec.source_type = 'agent' AND policy_rec.agent_id IS NOT NULL THEN
    -- Get agent details
    SELECT * INTO source_rec FROM agents WHERE id = policy_rec.agent_id;
    
    IF source_rec.percentage IS NOT NULL THEN
      calculated_agent_commission := calculated_insurer_commission * source_rec.percentage / 100;
      calculated_broker_share := calculated_insurer_commission - calculated_agent_commission;
    ELSE
      status := 'config_missing';
    END IF;
    
  ELSIF policy_rec.source_type = 'misp' AND policy_rec.misp_id IS NOT NULL THEN
    -- Get MISP details (assuming percentage field exists)
    SELECT percentage INTO source_rec FROM misps WHERE id = policy_rec.misp_id;
    
    IF source_rec IS NOT NULL THEN
      -- For MISP, assume there's a percentage field
      calculated_misp_commission := calculated_insurer_commission * COALESCE(50, 0) / 100; -- Default 50% if no percentage set
      calculated_broker_share := calculated_insurer_commission - calculated_misp_commission;
    ELSE
      status := 'config_missing';
    END IF;
    
  ELSIF policy_rec.source_type = 'employee' AND policy_rec.employee_id IS NOT NULL THEN
    -- Use organization employee share percentage
    IF org_config_rec.employee_share_percentage IS NOT NULL THEN
      calculated_employee_commission := calculated_insurer_commission * org_config_rec.employee_share_percentage / 100;
      calculated_broker_share := calculated_insurer_commission - calculated_employee_commission;
    ELSE
      -- Default to 60% if no config
      calculated_employee_commission := calculated_insurer_commission * 60 / 100;
      calculated_broker_share := calculated_insurer_commission - calculated_employee_commission;
    END IF;
    
  ELSE
    -- Direct org sale - all goes to broker
    calculated_broker_share := calculated_insurer_commission;
  END IF;

  RETURN QUERY SELECT 
    p_policy_id,
    grid_rec.commission_rate,
    calculated_insurer_commission,
    calculated_agent_commission,
    calculated_misp_commission,
    calculated_employee_commission,
    calculated_broker_share,
    status,
    grid_rec.id;
END;
$$;