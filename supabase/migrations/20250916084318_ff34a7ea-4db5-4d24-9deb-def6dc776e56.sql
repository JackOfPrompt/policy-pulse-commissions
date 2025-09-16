-- Add missing columns to revenue_table for proper commission calculations
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS employee_id uuid;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS agent_id uuid;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS misp_id uuid;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS employee_name text;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS agent_name text;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS misp_name text;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS reporting_employee_id uuid;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS reporting_employee_name text;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS calc_date timestamp with time zone DEFAULT now();
ALTER TABLE revenue_table ADD COLUMN IF NOT EXISTS commission_status text DEFAULT 'calculated';

-- Create or replace function to populate revenue_table with live commission data
CREATE OR REPLACE FUNCTION sync_revenue_table(p_org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  commission_rec RECORD;
BEGIN
  -- Clear existing data for the org (or all if no org specified)
  IF p_org_id IS NOT NULL THEN
    DELETE FROM revenue_table WHERE org_id = p_org_id;
  ELSE
    DELETE FROM revenue_table;
  END IF;

  -- Insert comprehensive commission data
  FOR commission_rec IN 
    SELECT 
      p.id as policy_id,
      p.policy_number,
      p.provider,
      p.source_type,
      p.employee_id,
      p.agent_id,
      p.misp_id,
      p.org_id,
      pt.name as product_type,
      COALESCE(p.premium_with_gst, p.premium_without_gst, p.gross_premium, 0) as premium,
      CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) as customer_name,
      e.name as employee_name,
      a.agent_name,
      m.channel_partner_name as misp_name,
      re.id as reporting_employee_id,
      re.name as reporting_employee_name,
      pc.commission_rate,
      pc.reward_rate,
      pc.insurer_commission,
      pc.agent_commission,
      pc.misp_commission,
      pc.employee_commission,
      pc.broker_share,
      pc.commission_status,
      pc.calc_date
    FROM policies p
    JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN employees e ON e.id = p.employee_id
    LEFT JOIN agents a ON a.id = p.agent_id
    LEFT JOIN misps m ON m.id = p.misp_id
    LEFT JOIN employees re ON re.id = a.employee_id OR re.id = m.employee_id
    LEFT JOIN policy_commissions pc ON pc.policy_id = p.id AND pc.is_active = true
    WHERE p.policy_status = 'active'
      AND (p_org_id IS NULL OR p.org_id = p_org_id)
  LOOP
    INSERT INTO revenue_table (
      policy_id,
      policy_number,
      provider,
      product_type,
      source_type,
      employee_id,
      agent_id,
      misp_id,
      employee_name,
      agent_name,
      misp_name,
      reporting_employee_id,
      reporting_employee_name,
      customer_name,
      org_id,
      premium,
      base_rate,
      reward_rate,
      bonus_rate,
      total_rate,
      insurer_commission,
      agent_commission,
      employee_commission,
      reporting_employee_commission,
      broker_share,
      commission_status,
      calc_date
    ) VALUES (
      commission_rec.policy_id,
      commission_rec.policy_number,
      commission_rec.provider,
      commission_rec.product_type,
      commission_rec.source_type,
      commission_rec.employee_id,
      commission_rec.agent_id,
      commission_rec.misp_id,
      commission_rec.employee_name,
      commission_rec.agent_name,
      commission_rec.misp_name,
      commission_rec.reporting_employee_id,
      commission_rec.reporting_employee_name,
      commission_rec.customer_name,
      commission_rec.org_id,
      commission_rec.premium,
      commission_rec.commission_rate,
      commission_rec.reward_rate,
      0, -- bonus_rate placeholder
      COALESCE(commission_rec.commission_rate, 0) + COALESCE(commission_rec.reward_rate, 0),
      commission_rec.insurer_commission,
      commission_rec.agent_commission,
      commission_rec.employee_commission,
      0, -- reporting_employee_commission placeholder
      commission_rec.broker_share,
      commission_rec.commission_status,
      commission_rec.calc_date
    );
  END LOOP;
END;
$$;

-- Enable RLS on revenue_table
ALTER TABLE revenue_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for revenue_table
CREATE POLICY "Users can view their org revenue data" 
ON revenue_table FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Admins can manage their org revenue data" 
ON revenue_table FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid() 
    AND user_organizations.role IN ('admin', 'superadmin')
));