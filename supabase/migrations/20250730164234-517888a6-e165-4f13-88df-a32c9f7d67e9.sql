-- Create enum types for lead management
CREATE TYPE public.lead_source AS ENUM (
  'Walk-in',
  'Website', 
  'Referral',
  'Tele-calling',
  'Campaign',
  'Social Media',
  'Advertisement',
  'Partner'
);

CREATE TYPE public.lead_status AS ENUM (
  'New',
  'Contacted', 
  'In Progress',
  'Converted',
  'Dropped'
);

CREATE TYPE public.assigned_to_type AS ENUM (
  'Employee',
  'Agent'
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_number TEXT NOT NULL DEFAULT ('LD-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('lead_number_seq'::regclass)::text, 6, '0')),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  location TEXT,
  line_of_business TEXT NOT NULL,
  product_id UUID REFERENCES public.insurance_products(id),
  insurance_provider_id UUID REFERENCES public.insurance_providers(id),
  lead_source lead_source NOT NULL DEFAULT 'Website',
  referred_by_employee_id UUID REFERENCES public.employees(id),
  referred_by_agent_id UUID REFERENCES public.agents(id),
  assigned_to_type assigned_to_type,
  assigned_to_employee_id UUID REFERENCES public.employees(id),
  assigned_to_agent_id UUID REFERENCES public.agents(id),
  branch_id UUID REFERENCES public.branches(id),
  lead_status lead_status NOT NULL DEFAULT 'New',
  reason_if_dropped TEXT,
  next_follow_up_date DATE,
  follow_up_notes TEXT,
  expected_premium NUMERIC,
  priority TEXT DEFAULT 'Medium',
  converted_policy_id UUID REFERENCES public.policies_new(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead follow-ups table
CREATE TABLE public.lead_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL,
  follow_up_time TIME,
  notes TEXT NOT NULL,
  follow_up_method TEXT DEFAULT 'Phone Call',
  outcome TEXT,
  next_follow_up_date DATE,
  reminder_set BOOLEAN DEFAULT false,
  reminder_by_employee_id UUID REFERENCES public.employees(id),
  reminder_by_agent_id UUID REFERENCES public.agents(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead number sequence
CREATE SEQUENCE IF NOT EXISTS public.lead_number_seq START 1;

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON public.leads(lead_status);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to_employee_id, assigned_to_agent_id);
CREATE INDEX idx_leads_product ON public.leads(product_id);
CREATE INDEX idx_leads_provider ON public.leads(insurance_provider_id);
CREATE INDEX idx_leads_branch ON public.leads(branch_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_lead_followups_lead_id ON public.lead_followups(lead_id);
CREATE INDEX idx_lead_followups_date ON public.lead_followups(follow_up_date);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Admin can manage all leads" 
ON public.leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Branch managers can manage their branch leads" 
ON public.leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN employees e ON e.user_id = ur.user_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'manager'::app_role 
    AND e.branch_id = leads.branch_id
  )
);

CREATE POLICY "Employees can view leads assigned to them" 
ON public.leads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() 
    AND e.id = leads.assigned_to_employee_id
  )
);

CREATE POLICY "Agents can view leads assigned to them" 
ON public.leads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.user_id = auth.uid() 
    AND a.id = leads.assigned_to_agent_id
  )
);

-- RLS Policies for lead follow-ups
CREATE POLICY "Admin can manage all lead followups" 
ON public.lead_followups 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Users can manage followups for their leads" 
ON public.lead_followups 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = lead_followups.lead_id
    AND (
      (l.assigned_to_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())) OR
      (l.assigned_to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())) OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role, 'manager'::app_role)
      )
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_followups_updated_at
  BEFORE UPDATE ON public.lead_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-link converted leads to policies
CREATE OR REPLACE FUNCTION public.link_lead_to_policy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If a policy is created and has a customer phone that matches a lead
  IF NEW.customer_phone IS NOT NULL THEN
    UPDATE public.leads 
    SET 
      lead_status = 'Converted',
      converted_policy_id = NEW.id,
      updated_at = now()
    WHERE 
      phone_number = NEW.customer_phone 
      AND lead_status IN ('New', 'Contacted', 'In Progress')
      AND converted_policy_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-link policies to leads
CREATE TRIGGER auto_link_policy_to_lead
  AFTER INSERT ON public.policies_new
  FOR EACH ROW
  EXECUTE FUNCTION public.link_lead_to_policy();