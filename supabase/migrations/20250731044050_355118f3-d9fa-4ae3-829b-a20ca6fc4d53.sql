-- Create escalation SLAs table
CREATE TABLE public.escalation_slas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  line_of_business TEXT NOT NULL,
  task_type TEXT NOT NULL,
  max_response_time_hours INTEGER NOT NULL DEFAULT 48,
  auto_escalate_to_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create task audit trail table
CREATE TABLE public.task_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escalation notifications table
CREATE TABLE public.escalation_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  policy_id UUID,
  escalated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_to TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('email', 'whatsapp', 'sms')),
  delivered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table for payout reclaims
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  policy_id UUID,
  payout_amount NUMERIC,
  recovered_by UUID,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add SLA tracking fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN sla_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN escalation_level INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.escalation_slas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin can manage escalation SLAs" ON public.escalation_slas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admin can view task audit trail" ON public.task_audit_trail
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admin can view escalation notifications" ON public.escalation_notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admin can view audit logs" ON public.audit_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create function to auto-escalate overdue tasks
CREATE OR REPLACE FUNCTION public.auto_escalate_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
  task_record RECORD;
BEGIN
  -- Update overdue tasks
  UPDATE public.tasks
  SET 
    status = 'Escalated',
    escalated_at = now(),
    escalation_level = escalation_level + 1,
    updated_at = now()
  WHERE 
    status IN ('Open', 'In Progress')
    AND (sla_deadline < now() OR (sla_deadline IS NULL AND due_date < now() - INTERVAL '48 hours'))
    AND status != 'Escalated';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Create audit trail entries for escalated tasks
  FOR task_record IN 
    SELECT id, task_title, assigned_to_employee_id, assigned_to_agent_id, related_id
    FROM public.tasks 
    WHERE escalated_at >= now() - INTERVAL '1 hour'
  LOOP
    INSERT INTO public.task_audit_trail (
      task_id,
      action,
      previous_status,
      new_status,
      notes
    ) VALUES (
      task_record.id,
      'Auto-escalated',
      'Open',
      'Escalated',
      'Auto-escalated due to SLA breach (48+ hours overdue)'
    );
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Create function to log payout reclaim events
CREATE OR REPLACE FUNCTION public.log_payout_reclaim()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  payout_amount_val NUMERIC;
BEGIN
  -- Check if policy status changed to Free Look Cancellation
  IF NEW.policy_status = 'Free Look Cancellation' AND OLD.policy_status != 'Free Look Cancellation' THEN
    
    -- Check if there's a completed payout for this policy
    SELECT pt.payout_amount INTO payout_amount_val
    FROM payout_transactions pt
    WHERE pt.policy_id = NEW.id AND pt.payout_status = 'Completed'
    LIMIT 1;
    
    -- If payout exists, log the reclaim event
    IF payout_amount_val IS NOT NULL THEN
      INSERT INTO public.audit_logs (
        event,
        entity_type,
        entity_id,
        policy_id,
        payout_amount,
        recovered_by,
        reason,
        metadata
      ) VALUES (
        'Payout Reclaim Required',
        'policy',
        NEW.id,
        NEW.id,
        payout_amount_val,
        NEW.status_updated_by,
        'Free Look Cancellation',
        jsonb_build_object(
          'policy_number', NEW.policy_number,
          'previous_status', OLD.policy_status,
          'new_status', NEW.policy_status
        )
      );
      
      -- Create finance task for payout recovery
      INSERT INTO public.tasks (
        task_title,
        description,
        assigned_to_employee_id,
        related_to,
        related_id,
        priority,
        task_type,
        due_date,
        status,
        created_by_id
      ) VALUES (
        'Reclaim Payout - Policy #' || NEW.policy_number,
        'Policy cancelled under free look period. Payout amount: ₹' || payout_amount_val || ' needs to be reclaimed.',
        (SELECT id FROM employees WHERE role = 'finance' AND status = 'Active' LIMIT 1),
        'Policy',
        NEW.id,
        'High',
        'Payment Collection',
        CURRENT_DATE + INTERVAL '2 days',
        'Open',
        NEW.status_updated_by
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payout reclaim logging
CREATE TRIGGER trigger_log_payout_reclaim
  AFTER UPDATE ON public.policies_new
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payout_reclaim();

-- Insert default SLA configurations
INSERT INTO public.escalation_slas (role, line_of_business, task_type, max_response_time_hours, auto_escalate_to_role) VALUES
('ops', 'Motor', 'Review', 24, 'manager'),
('ops', 'Health', 'Review', 48, 'manager'),
('ops', 'Life', 'Review', 72, 'manager'),
('finance', 'Motor', 'Payment Collection', 24, 'admin'),
('finance', 'Health', 'Payment Collection', 48, 'admin'),
('finance', 'Life', 'Payment Collection', 48, 'admin'),
('agent', 'Motor', 'Follow-up', 12, 'ops'),
('agent', 'Health', 'Follow-up', 24, 'ops'),
('agent', 'Life', 'Follow-up', 48, 'ops');

-- Create triggers for automatic SLA assignment on task creation
CREATE OR REPLACE FUNCTION public.assign_task_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sla_hours INTEGER;
  assigned_role TEXT;
BEGIN
  -- Determine the assigned role
  IF NEW.assigned_to_employee_id IS NOT NULL THEN
    SELECT role INTO assigned_role FROM employees WHERE id = NEW.assigned_to_employee_id;
  ELSIF NEW.assigned_to_agent_id IS NOT NULL THEN
    assigned_role := 'agent';
  END IF;
  
  -- Get SLA configuration
  SELECT max_response_time_hours INTO sla_hours
  FROM escalation_slas
  WHERE role = assigned_role
    AND line_of_business = COALESCE(
      (SELECT line_of_business FROM policies_new WHERE id = NEW.related_id AND NEW.related_to = 'Policy'),
      'Motor'
    )
    AND task_type = NEW.task_type
    AND is_active = true
  LIMIT 1;
  
  -- Set SLA deadline
  IF sla_hours IS NOT NULL THEN
    NEW.sla_deadline := NEW.created_at + (sla_hours || ' hours')::INTERVAL;
  ELSE
    -- Default 48 hours if no SLA found
    NEW.sla_deadline := NEW.created_at + INTERVAL '48 hours';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_assign_task_sla
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_task_sla();