-- Create AgentTier table
CREATE TABLE public.agent_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default tiers
INSERT INTO public.agent_tiers (name, description, level) VALUES
('Bronze', 'Entry level tier for new agents', 1),
('Silver', 'Intermediate tier for performing agents', 2),
('Gold', 'Premium tier for top performing agents', 3);

-- Create TierPayoutRule table
CREATE TABLE public.tier_payout_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_tier_id UUID NOT NULL,
  product_id UUID NOT NULL,
  agent_type TEXT NOT NULL,
  commission_type TEXT NOT NULL DEFAULT 'Percentage',
  commission_value NUMERIC NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.tier_payout_rules 
ADD CONSTRAINT fk_tier_payout_rules_agent_tier 
FOREIGN KEY (agent_tier_id) REFERENCES public.agent_tiers(id) ON DELETE CASCADE;

ALTER TABLE public.tier_payout_rules 
ADD CONSTRAINT fk_tier_payout_rules_product 
FOREIGN KEY (product_id) REFERENCES public.insurance_products(id) ON DELETE CASCADE;

-- Add tier_id to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS tier_id UUID;

-- Add foreign key constraint for agents tier
ALTER TABLE public.agents 
ADD CONSTRAINT fk_agents_tier 
FOREIGN KEY (tier_id) REFERENCES public.agent_tiers(id) ON DELETE SET NULL;

-- Set default tier for existing agents (Bronze)
UPDATE public.agents 
SET tier_id = (SELECT id FROM public.agent_tiers WHERE name = 'Bronze' LIMIT 1)
WHERE tier_id IS NULL;

-- Enable RLS on new tables
ALTER TABLE public.agent_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_payout_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all agent tiers" 
ON public.agent_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all tier payout rules" 
ON public.tier_payout_rules 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_agent_tiers_updated_at
BEFORE UPDATE ON public.agent_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tier_payout_rules_updated_at
BEFORE UPDATE ON public.tier_payout_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();