-- Drop existing policies on plans table
DROP POLICY IF EXISTS "Plans are viewable by all authenticated users" ON plans;
DROP POLICY IF EXISTS "Super admins can manage plans" ON plans;

-- Drop existing policies on subscriptions table  
DROP POLICY IF EXISTS "Org admins can manage their org subscription" ON subscriptions;
DROP POLICY IF EXISTS "Super admins can manage all subscriptions" ON subscriptions;

-- Plans: Super Admin only CRUD + Read access for all authenticated users
CREATE POLICY "Super admins can manage plans"
ON plans
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'superadmin'
  )
);

CREATE POLICY "Anyone can read plans"
ON plans
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Subscriptions: Super Admin full control + Admin read-only for their org
CREATE POLICY "Super admins can manage all subscriptions"
ON subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'superadmin'
  )
);

CREATE POLICY "Admins can view their org subscription"
ON subscriptions
FOR SELECT
USING (
  org_id IN (
    SELECT uo.org_id FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'admin'
  )
);

-- Create subscription_requests table
CREATE TABLE IF NOT EXISTS subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on subscription_requests
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Admins can create requests for their org
CREATE POLICY "Admins can create subscription requests"
ON subscription_requests
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT uo.org_id FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'admin'
  )
);

-- Admins can view their own org requests
CREATE POLICY "Admins can view their org requests"
ON subscription_requests
FOR SELECT
USING (
  org_id IN (
    SELECT uo.org_id FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'admin'
  )
);

-- Super Admin manages all requests
CREATE POLICY "Super admins can manage all requests"
ON subscription_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'superadmin'
  )
);

-- Add updated_at trigger for subscription_requests
CREATE TRIGGER update_subscription_requests_updated_at
  BEFORE UPDATE ON subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();