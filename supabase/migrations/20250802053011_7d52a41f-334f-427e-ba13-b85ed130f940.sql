-- Add missing task_type enum values and fix the function
-- First, add the missing enum values
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Review';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Underwriting';
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'Verification';

-- Update the function to use proper enum casting
CREATE OR REPLACE FUNCTION public.enhanced_log_policy_status_change_with_tasks()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  user_role_text text;
  task_title text;
  task_description text;
  task_priority text;
  task_due_date date;
  assigned_employee_id uuid;
  finance_employee_id uuid;
  ops_employee_id uuid;
BEGIN
  IF OLD.policy_status IS DISTINCT FROM NEW.policy_status THEN
    -- Get the user's primary role
    SELECT role::text INTO user_role_text
    FROM user_roles
    WHERE user_id = NEW.status_updated_by
    LIMIT 1;
    
    -- Insert into policy status history
    INSERT INTO public.policy_status_history (
      policy_id,
      previous_status,
      new_status,
      updated_by,
      changed_by_role
    ) VALUES (
      NEW.id,
      OLD.policy_status,
      NEW.policy_status,
      NEW.status_updated_by,
      user_role_text
    );
    
    -- Auto-create follow-up tasks based on status
    IF NEW.policy_status = 'Underwriting' THEN
      -- Create underwriting review task
      task_title := 'Review Policy #' || NEW.policy_number || ' — Underwriting';
      task_description := 'Policy requires underwriting review. ' || COALESCE(NEW.remarks, '');
      task_priority := 'Medium';
      task_due_date := CURRENT_DATE + INTERVAL '1 day';
      
      -- Assign to the employee who created the policy or any ops role employee
      IF NEW.employee_id IS NOT NULL THEN
        assigned_employee_id := NEW.employee_id;
      ELSE
        -- Find first available operations employee
        SELECT id INTO ops_employee_id
        FROM employees 
        WHERE role = 'ops' AND status = 'Active'
        LIMIT 1;
        assigned_employee_id := ops_employee_id;
      END IF;
      
      -- Create the task with proper enum casting
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
        task_title,
        task_description,
        assigned_employee_id,
        'Policy',
        NEW.id,
        task_priority,
        'Review'::task_type,  -- Explicit casting to enum
        task_due_date,
        'Open',
        NEW.status_updated_by
      );
      
    ELSIF NEW.policy_status = 'Free Look Cancellation' THEN
      -- Create finance review task for payout reversal
      task_title := 'Review Policy #' || NEW.policy_number || ' — Free Look Cancellation';
      task_description := 'Policy cancelled under free look period. Review for payout reversal requirement. ' || COALESCE(NEW.remarks, '');
      task_priority := 'High';
      task_due_date := CURRENT_DATE + INTERVAL '1 day';
      
      -- Find first available finance employee
      SELECT id INTO finance_employee_id
      FROM employees 
      WHERE role = 'finance' AND status = 'Active'
      LIMIT 1;
      
      IF finance_employee_id IS NOT NULL THEN
        -- Create the task with proper enum casting
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
          task_title,
          task_description,
          finance_employee_id,
          'Policy',
          NEW.id,
          task_priority,
          'Review'::task_type,  -- Explicit casting to enum
          task_due_date,
          'Open',
          NEW.status_updated_by
        );
      END IF;
      
      -- Check if payout reversal is required
      IF EXISTS (
        SELECT 1 FROM payout_transactions pt 
        WHERE pt.policy_id = NEW.id AND pt.payout_status = 'Completed'
      ) THEN
        NEW.payout_reversal_required = true;
        
        -- Create notification for finance team
        INSERT INTO public.notifications (
          entity_type,
          entity_id,
          recipient_role,
          message,
          notification_type
        ) VALUES (
          'policy',
          NEW.id,
          'finance',
          'Policy ' || NEW.policy_number || ' requires payout reversal due to Free Look Cancellation',
          'payout_reversal'
        );
      END IF;
    END IF;
    
    -- Set alert flag for underwriting delays
    IF NEW.policy_status = 'Underwriting' THEN
      NEW.alert_flag = (EXTRACT(EPOCH FROM (now() - NEW.status_updated_at)) / 86400) > 2;
    ELSE
      NEW.alert_flag = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;