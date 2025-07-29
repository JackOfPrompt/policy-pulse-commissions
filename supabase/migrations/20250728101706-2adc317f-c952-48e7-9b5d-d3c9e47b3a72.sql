-- Create policy_renewals table
CREATE TABLE public.policy_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies_new(id),
  customer_name TEXT NOT NULL,
  agent_id UUID REFERENCES public.agents(id),
  employee_id UUID REFERENCES public.employees(id),
  branch_id UUID REFERENCES public.branches(id),
  product_id UUID REFERENCES public.insurance_products(id),
  insurer_id UUID REFERENCES public.insurance_providers(id),
  original_expiry_date DATE NOT NULL,
  renewal_due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  renewal_status TEXT NOT NULL DEFAULT 'Pending' CHECK (renewal_status IN ('Pending', 'Renewed', 'Missed', 'Cancelled')),
  follow_up_date DATE,
  remarks TEXT,
  auto_created_renewal_policy_id UUID REFERENCES public.policies_new(id),
  renewal_reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create policy_renewal_logs table
CREATE TABLE public.policy_renewal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  renewal_id UUID NOT NULL REFERENCES public.policy_renewals(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('Reminder Sent', 'Call Made', 'Email Sent', 'Policy Renewed', 'Status Updated', 'Follow-up Scheduled')),
  performed_by UUID REFERENCES public.employees(id),
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.policy_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewal_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for policy_renewals
CREATE POLICY "Admins can manage all policy renewals" 
ON public.policy_renewals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for policy_renewal_logs  
CREATE POLICY "Admins can manage all policy renewal logs" 
ON public.policy_renewal_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_policy_renewals_updated_at
BEFORE UPDATE ON public.policy_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_policy_renewals_renewal_due_date ON public.policy_renewals(renewal_due_date);
CREATE INDEX idx_policy_renewals_status ON public.policy_renewals(renewal_status);
CREATE INDEX idx_policy_renewals_policy_id ON public.policy_renewals(policy_id);
CREATE INDEX idx_policy_renewal_logs_renewal_id ON public.policy_renewal_logs(renewal_id);
CREATE INDEX idx_policy_renewal_logs_timestamp ON public.policy_renewal_logs(timestamp);

-- Create function to auto-create renewal records when policies are added
CREATE OR REPLACE FUNCTION public.create_policy_renewal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create renewal record if policy has an end date
  IF NEW.policy_end_date IS NOT NULL THEN
    INSERT INTO public.policy_renewals (
      policy_id,
      customer_name,
      agent_id,
      employee_id,
      branch_id,
      product_id,
      insurer_id,
      original_expiry_date,
      renewal_due_date
    ) VALUES (
      NEW.id,
      COALESCE(NEW.policy_number, 'Unknown Customer'), -- Placeholder since we don't have customer name in policies_new
      NEW.agent_id,
      NEW.employee_id,
      NEW.branch_id,
      NEW.product_id,
      NEW.insurer_id,
      NEW.policy_end_date,
      NEW.policy_end_date
    );
    
    -- Log the creation
    INSERT INTO public.policy_renewal_logs (
      renewal_id,
      action,
      performed_by,
      notes
    ) VALUES (
      (SELECT id FROM public.policy_renewals WHERE policy_id = NEW.id),
      'Status Updated',
      NEW.created_by,
      'Renewal record auto-created from new policy'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create renewals
CREATE TRIGGER auto_create_policy_renewal
AFTER INSERT ON public.policies_new
FOR EACH ROW
EXECUTE FUNCTION public.create_policy_renewal();

-- Create view for renewal dashboard with related data
CREATE OR REPLACE VIEW public.renewals_with_details AS
SELECT 
  pr.*,
  p.policy_number,
  p.premium_amount,
  ip.provider_name as insurer_name,
  prod.name as product_name,
  a.name as agent_name,
  a.agent_code,
  e.name as employee_name,
  b.name as branch_name,
  CASE 
    WHEN pr.renewal_due_date < CURRENT_DATE THEN 'Overdue'
    WHEN pr.renewal_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due Soon'
    ELSE 'Upcoming'
  END as urgency_status,
  (pr.renewal_due_date - CURRENT_DATE) as days_until_due
FROM public.policy_renewals pr
LEFT JOIN public.policies_new p ON pr.policy_id = p.id
LEFT JOIN public.insurance_providers ip ON pr.insurer_id = ip.id
LEFT JOIN public.insurance_products prod ON pr.product_id = prod.id
LEFT JOIN public.agents a ON pr.agent_id = a.id
LEFT JOIN public.employees e ON pr.employee_id = e.id
LEFT JOIN public.branches b ON pr.branch_id = b.id;