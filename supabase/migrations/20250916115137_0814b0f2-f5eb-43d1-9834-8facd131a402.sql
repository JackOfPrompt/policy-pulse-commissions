-- Create the missing policy_commissions table
CREATE TABLE policy_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id uuid NOT NULL,
  org_id uuid NOT NULL,
  product_type text,
  grid_table text,
  grid_id uuid,
  commission_rate numeric DEFAULT 0,
  reward_rate numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  reward_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  insurer_commission numeric DEFAULT 0,
  agent_commission numeric DEFAULT 0,
  misp_commission numeric DEFAULT 0,
  employee_commission numeric DEFAULT 0,
  broker_share numeric DEFAULT 0,
  commission_status text DEFAULT 'pending',
  calc_date timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE(policy_id) WHERE is_active = true
);

-- Enable RLS
ALTER TABLE policy_commissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for policy_commissions
CREATE POLICY "Users can view their org policy commissions" 
ON policy_commissions FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert their org policy commissions" 
ON policy_commissions FOR INSERT 
WITH CHECK (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can update their org policy commissions" 
ON policy_commissions FOR UPDATE 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_policy_commissions_updated_at
  BEFORE UPDATE ON policy_commissions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();