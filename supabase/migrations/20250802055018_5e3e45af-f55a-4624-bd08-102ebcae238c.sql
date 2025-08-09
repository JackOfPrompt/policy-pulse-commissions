-- Fix the task_type comparison issue in assign_task_sla function
CREATE OR REPLACE FUNCTION public.assign_task_sla()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
  
  -- Get SLA configuration - cast enum to text for comparison
  SELECT max_response_time_hours INTO sla_hours
  FROM escalation_slas
  WHERE role = assigned_role
    AND line_of_business = COALESCE(
      (SELECT line_of_business FROM policies_new WHERE id = NEW.related_id AND NEW.related_to = 'Policy'),
      'Motor'
    )
    AND task_type = NEW.task_type::text
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
$function$;