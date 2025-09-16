-- Enable uuid extension if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create commission_tiers table with proper multi-tenant structure
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_premium NUMERIC,
  max_premium NUMERIC,
  product_type_id UUID REFERENCES product_types(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add commission tier and override fields to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS commission_tier_id UUID REFERENCES commission_tiers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS override_percentage NUMERIC(5,2);

-- Add commission tier and override fields to misps table  
ALTER TABLE misps
ADD COLUMN IF NOT EXISTS commission_tier_id UUID REFERENCES commission_tiers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS override_percentage NUMERIC(5,2);

-- Create audit table for commission history
CREATE TABLE IF NOT EXISTS agent_commission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  misp_id UUID REFERENCES misps(id) ON DELETE SET NULL,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  applied_tier_id UUID REFERENCES commission_tiers(id) ON DELETE SET NULL,
  used_override BOOLEAN DEFAULT false,
  commission_percentage NUMERIC(8,4) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commission_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for commission_tiers
CREATE POLICY "Users can manage their org commission tiers" ON commission_tiers
FOR ALL USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
) WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- RLS policies for agent_commission_history
CREATE POLICY "Users can view their org commission history" ON agent_commission_history
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their org commission history" ON agent_commission_history
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_commission_tiers_org_id ON commission_tiers(org_id);
CREATE INDEX IF NOT EXISTS idx_commission_tiers_product_provider ON commission_tiers(org_id, product_type_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_agents_commission_tier ON agents(commission_tier_id);
CREATE INDEX IF NOT EXISTS idx_misps_commission_tier ON misps(commission_tier_id);
CREATE INDEX IF NOT EXISTS idx_agent_comm_history_org ON agent_commission_history(org_id);

-- Update trigger for commission_tiers
CREATE OR REPLACE FUNCTION update_commission_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commission_tiers_updated_at
  BEFORE UPDATE ON commission_tiers
  FOR EACH ROW EXECUTE FUNCTION update_commission_tiers_updated_at();