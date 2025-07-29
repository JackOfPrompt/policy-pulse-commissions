-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.create_policy_renewal()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
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
$$;