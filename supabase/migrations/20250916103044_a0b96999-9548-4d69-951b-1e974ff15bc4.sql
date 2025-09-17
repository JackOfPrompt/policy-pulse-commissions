-- Create policy revenue history table for audit trail
CREATE TABLE IF NOT EXISTS public.policy_revenue_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL,
  policy_number TEXT,
  provider TEXT,
  product_type TEXT,
  source_type TEXT,
  employee_id UUID,
  agent_id UUID,
  misp_id UUID,
  employee_name TEXT,
  agent_name TEXT,
  misp_name TEXT,
  reporting_employee_id UUID,
  reporting_employee_name TEXT,
  customer_name TEXT,
  org_id UUID NOT NULL,
  premium NUMERIC,
  base_rate NUMERIC DEFAULT 0,
  reward_rate NUMERIC DEFAULT 0,
  bonus_rate NUMERIC DEFAULT 0,
  total_rate NUMERIC DEFAULT 0,
  insurer_commission NUMERIC DEFAULT 0,
  agent_commission NUMERIC DEFAULT 0,
  employee_commission NUMERIC DEFAULT 0,
  reporting_employee_commission NUMERIC DEFAULT 0,
  broker_share NUMERIC DEFAULT 0,
  commission_status TEXT DEFAULT 'calculated',
  calc_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT,
  changed_by UUID
);

-- Enable RLS
ALTER TABLE public.policy_revenue_history ENABLE ROW LEVEL SECURITY;

-- Create policies for policy_revenue_history
CREATE POLICY "Users can view their org revenue history" 
ON public.policy_revenue_history 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert their org revenue history" 
ON public.policy_revenue_history 
FOR INSERT 
WITH CHECK (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create trigger to automatically insert into history when revenue_table changes
CREATE OR REPLACE FUNCTION public.track_revenue_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into history table
  INSERT INTO public.policy_revenue_history (
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
    calc_date,
    change_reason,
    changed_by
  ) VALUES (
    NEW.policy_id,
    NEW.policy_number,
    NEW.provider,
    NEW.product_type,
    NEW.source_type,
    NEW.employee_id,
    NEW.agent_id,
    NEW.misp_id,
    NEW.employee_name,
    NEW.agent_name,
    NEW.misp_name,
    NEW.reporting_employee_id,
    NEW.reporting_employee_name,
    NEW.customer_name,
    NEW.org_id,
    NEW.premium,
    NEW.base_rate,
    NEW.reward_rate,
    NEW.bonus_rate,
    NEW.total_rate,
    NEW.insurer_commission,
    NEW.agent_commission,
    NEW.employee_commission,
    NEW.reporting_employee_commission,
    NEW.broker_share,
    NEW.commission_status,
    NEW.calc_date,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Initial calculation'
      WHEN TG_OP = 'UPDATE' THEN 'Commission recalculated'
      ELSE 'Unknown'
    END,
    auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;