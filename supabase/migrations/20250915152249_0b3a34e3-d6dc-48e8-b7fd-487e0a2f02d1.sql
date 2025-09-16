-- Check if commission_tiers table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commission_tiers') THEN
    CREATE TABLE commission_tiers (
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
  END IF;
END $$;

-- Add commission tier columns to agents if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='agents' AND column_name='commission_tier_id'
  ) THEN
    ALTER TABLE agents ADD COLUMN commission_tier_id UUID REFERENCES commission_tiers(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='agents' AND column_name='override_percentage'
  ) THEN
    ALTER TABLE agents ADD COLUMN override_percentage NUMERIC(5,2);
  END IF;
END $$;

-- Add commission tier columns to misps if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='misps' AND column_name='commission_tier_id'
  ) THEN
    ALTER TABLE misps ADD COLUMN commission_tier_id UUID REFERENCES commission_tiers(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='misps' AND column_name='override_percentage'
  ) THEN
    ALTER TABLE misps ADD COLUMN override_percentage NUMERIC(5,2);
  END IF;
END $$;

-- Create agent_commission_history table if it doesn't exist
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

-- Enable RLS for agent_commission_history
ALTER TABLE agent_commission_history ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_commission_history if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_commission_history' 
    AND policyname = 'Users can view their org commission history'
  ) THEN
    CREATE POLICY "Users can view their org commission history" ON agent_commission_history
    FOR SELECT USING (
      org_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_commission_history' 
    AND policyname = 'Users can insert their org commission history'
  ) THEN
    CREATE POLICY "Users can insert their org commission history" ON agent_commission_history
    FOR INSERT WITH CHECK (
      org_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;