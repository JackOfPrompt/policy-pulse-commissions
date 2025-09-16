-- Create providers table if it doesn't exist (referenced in commission_tiers)
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  org_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Enable RLS on providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for providers
CREATE POLICY "Users can manage their organization's providers"
ON public.providers FOR ALL
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's providers"
ON public.providers FOR SELECT
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

-- Create commission_tiers table (multi-tenant aware)
CREATE TABLE public.commission_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_percentage numeric NOT NULL DEFAULT 0,
  min_premium numeric,
  max_premium numeric,
  product_type_id uuid REFERENCES product_types(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT commission_tiers_org_name_unique UNIQUE(org_id, name)
);

-- Enable RLS on commission_tiers
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

-- RLS policies for commission_tiers
CREATE POLICY "Users can manage their organization's commission tiers"
ON public.commission_tiers FOR ALL
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's commission tiers"
ON public.commission_tiers FOR SELECT
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

-- Extend agents table (commission_tier_id and override_percentage)
-- Note: agents table already has org_id, so we don't add it again
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS commission_tier_id uuid REFERENCES commission_tiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS override_percentage numeric;

-- Create agent_commission_history table
CREATE TABLE public.agent_commission_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
  commission_amount numeric NOT NULL,
  commission_percentage numeric NOT NULL,
  applied_tier_id uuid REFERENCES commission_tiers(id) ON DELETE SET NULL,
  tier_name text,
  was_override_used boolean DEFAULT false,
  org_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on agent_commission_history
ALTER TABLE public.agent_commission_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_commission_history
CREATE POLICY "Users can manage their organization's agent commission history"
ON public.agent_commission_history FOR ALL
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their organization's agent commission history"
ON public.agent_commission_history FOR SELECT
USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

-- Add updated_at trigger for commission_tiers
CREATE TRIGGER update_commission_tiers_updated_at
  BEFORE UPDATE ON public.commission_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger for providers
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();