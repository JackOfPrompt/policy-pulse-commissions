-- Create sequence for lead number first
CREATE SEQUENCE IF NOT EXISTS lead_number_seq START 1;

-- Create enum types for lead management
CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'In Progress', 'Converted', 'Dropped');
CREATE TYPE lead_source AS ENUM ('Walk-in', 'Website', 'Referral', 'Tele-calling', 'Campaign', 'API');
CREATE TYPE assigned_to_type AS ENUM ('Employee', 'Agent');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_number TEXT NOT NULL DEFAULT ('LD-' || to_char(now(), 'YYYYMM') || '-' || lpad((nextval('lead_number_seq'::regclass))::text, 6, '0')),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  location TEXT,
  line_of_business TEXT NOT NULL,
  product_id UUID REFERENCES public.insurance_products(id),
  insurance_provider_id UUID REFERENCES public.insurance_providers(id),
  lead_source lead_source NOT NULL DEFAULT 'Walk-in',
  referred_by UUID, -- Can be employee or agent ID
  assigned_to_type assigned_to_type,
  assigned_to_id UUID, -- Employee or Agent ID
  branch_id UUID REFERENCES public.branches(id),
  lead_status lead_status NOT NULL DEFAULT 'New',
  reason_if_dropped TEXT,
  next_follow_up_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_policy_id UUID REFERENCES public.policies_new(id),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'))
);

-- Create follow_ups table
CREATE TABLE public.lead_follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL,
  follow_up_time TIME,
  notes TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Missed')),
  reminder_set_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_status_history table for tracking status changes
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  previous_status lead_status,
  new_status lead_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Admin can manage all leads" 
ON public.leads 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE POLICY "Branch managers can manage their branch leads" 
ON public.leads 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  JOIN employees e ON e.user_id = ur.user_id 
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'manager'::app_role 
  AND e.branch_id = leads.branch_id
));

CREATE POLICY "Users can manage assigned leads" 
ON public.leads 
FOR ALL 
USING (
  assigned_to_type = 'Employee' AND 
  assigned_to_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  OR
  assigned_to_type = 'Agent' AND 
  assigned_to_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);

-- Create RLS policies for follow_ups
CREATE POLICY "Admin can manage all follow_ups" 
ON public.lead_follow_ups 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE POLICY "Users can manage follow_ups for their leads" 
ON public.lead_follow_ups 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM leads l 
  WHERE l.id = lead_follow_ups.lead_id 
  AND (
    (l.assigned_to_type = 'Employee' AND l.assigned_to_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
    OR 
    (l.assigned_to_type = 'Agent' AND l.assigned_to_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
  )
));

-- Create RLS policies for status history
CREATE POLICY "Admin can view all status history" 
ON public.lead_status_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE POLICY "Users can view status history for their leads" 
ON public.lead_status_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM leads l 
  WHERE l.id = lead_status_history.lead_id 
  AND (
    (l.assigned_to_type = 'Employee' AND l.assigned_to_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
    OR 
    (l.assigned_to_type = 'Agent' AND l.assigned_to_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
  )
));

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_follow_ups_updated_at
  BEFORE UPDATE ON public.lead_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to track status changes
CREATE OR REPLACE FUNCTION public.track_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lead_status != NEW.lead_status THEN
    INSERT INTO public.lead_status_history (
      lead_id,
      previous_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.lead_status,
      NEW.lead_status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER track_lead_status_changes
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.track_lead_status_change();

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON public.leads(lead_status);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to_type, assigned_to_id);
CREATE INDEX idx_leads_product ON public.leads(product_id);
CREATE INDEX idx_leads_branch ON public.leads(branch_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_follow_ups_date ON public.lead_follow_ups(follow_up_date);
CREATE INDEX idx_follow_ups_lead ON public.lead_follow_ups(lead_id);