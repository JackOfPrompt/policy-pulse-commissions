-- Fix RLS issues for tables that need to be enabled
ALTER TABLE public.policies_with_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_commission_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for the views/tables that were missing RLS
CREATE POLICY "Admin can view policies with details" ON public.policies_with_details
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admin can view payout reports" ON public.payout_reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admin can view active commission rules" ON public.active_commission_rules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Fix function search paths by setting them properly
CREATE OR REPLACE FUNCTION public.auto_escalate_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.log_payout_reclaim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.assign_task_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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