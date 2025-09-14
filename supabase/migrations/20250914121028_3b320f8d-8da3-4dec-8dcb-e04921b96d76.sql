-- Create subscription_upgrade_requests table
CREATE TABLE IF NOT EXISTS subscription_upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  current_plan_id uuid NOT NULL REFERENCES plans(id),
  requested_plan_id uuid NOT NULL REFERENCES plans(id),
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','approved','rejected')),
  justification text,
  
  -- File attachments (can be multiple)
  attachment_urls text[] DEFAULT '{}',

  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast filtering
CREATE INDEX ON subscription_upgrade_requests (org_id, status);

-- Enable RLS
ALTER TABLE subscription_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Admins: create/view only for their org
CREATE POLICY "Admins can create upgrade requests for their org"
  ON subscription_upgrade_requests
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.org_id = subscription_upgrade_requests.org_id
      AND uo.role = 'admin'
  ));

CREATE POLICY "Admins can view upgrade requests for their org"
  ON subscription_upgrade_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.org_id = subscription_upgrade_requests.org_id
      AND uo.role = 'admin'
  ));

-- Super Admins: full control
CREATE POLICY "Super Admins full access to upgrade requests"
  ON subscription_upgrade_requests
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role = 'superadmin'
  ));

-- Create storage bucket for upgrade request attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('upgrade-requests', 'upgrade-requests', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Admins can upload files for their org"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'upgrade-requests' AND
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins and Super Admins can view upgrade request files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'upgrade-requests' AND
  EXISTS (
    SELECT 1 FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'superadmin')
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_subscription_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_requests_updated_at
  BEFORE UPDATE ON subscription_upgrade_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_requests_updated_at();