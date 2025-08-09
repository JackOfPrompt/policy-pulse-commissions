-- First, let's check and enhance the policy_status_history table structure
-- Add missing fields if they don't exist
ALTER TABLE public.policy_status_history 
ADD COLUMN IF NOT EXISTS changed_by_role text,
ADD COLUMN IF NOT EXISTS remarks text;

-- Add payout_reversal_required and alert_flag to policies_new table
ALTER TABLE public.policies_new 
ADD COLUMN IF NOT EXISTS payout_reversal_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_flag boolean DEFAULT false;

-- Create notifications table for automated alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id),
  recipient_role app_role,
  message text NOT NULL,
  notification_type text NOT NULL,
  read_status boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their notifications" 
ON public.notifications 
FOR SELECT 
USING (
  recipient_user_id = auth.uid() OR 
  (recipient_role IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = recipient_role
  ))
);

CREATE POLICY "Admin can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Function to check if user has permission for status transition
CREATE OR REPLACE FUNCTION public.can_transition_policy_status(
  current_status policy_status_enum,
  new_status policy_status_enum,
  user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_roles text[];
BEGIN
  -- Get user roles
  SELECT array_agg(role::text) INTO user_roles
  FROM user_roles ur
  WHERE ur.user_id = user_id;
  
  -- Admin can do any transition
  IF 'admin' = ANY(user_roles) THEN
    RETURN true;
  END IF;
  
  -- Check specific transition rules
  CASE 
    -- Any → Underwriting: Ops, Admin
    WHEN new_status = 'Underwriting' THEN
      RETURN 'ops' = ANY(user_roles) OR 'admin' = ANY(user_roles);
    
    -- Underwriting → Issued: Ops, Admin
    WHEN current_status = 'Underwriting' AND new_status = 'Issued' THEN
      RETURN 'ops' = ANY(user_roles) OR 'admin' = ANY(user_roles);
    
    -- Underwriting → Rejected: Ops, Admin
    WHEN current_status = 'Underwriting' AND new_status = 'Rejected' THEN
      RETURN 'ops' = ANY(user_roles) OR 'admin' = ANY(user_roles);
    
    -- Issued → Cancelled: Ops, Admin
    WHEN current_status = 'Issued' AND new_status = 'Cancelled' THEN
      RETURN 'ops' = ANY(user_roles) OR 'admin' = ANY(user_roles);
    
    -- Issued → Free Look Cancellation: Finance, Admin
    WHEN current_status = 'Issued' AND new_status = 'Free Look Cancellation' THEN
      RETURN 'finance' = ANY(user_roles) OR 'admin' = ANY(user_roles);
    
    -- No transitions from Cancelled or Rejected
    WHEN current_status IN ('Cancelled', 'Rejected') THEN
      RETURN false;
    
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Enhanced policy status change logging trigger
CREATE OR REPLACE FUNCTION public.enhanced_log_policy_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  user_role_text text;
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
    
    -- Check for payout reversal requirement
    IF NEW.policy_status = 'Free Look Cancellation' THEN
      -- Check if payout already exists for this policy
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
$$;

-- Drop the old trigger and create the new one
DROP TRIGGER IF EXISTS log_policy_status_change ON public.policies_new;
CREATE TRIGGER enhanced_log_policy_status_change
  BEFORE UPDATE ON public.policies_new
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_log_policy_status_change();

-- Function to update overdue policy alerts
CREATE OR REPLACE FUNCTION public.update_policy_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update alert flags for underwriting delays
  UPDATE public.policies_new
  SET alert_flag = true
  WHERE policy_status = 'Underwriting'
    AND EXTRACT(EPOCH FROM (now() - status_updated_at)) / 86400 > 2
    AND alert_flag = false;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Create notifications for policies overdue > 5 days
  INSERT INTO public.notifications (
    entity_type,
    entity_id,
    recipient_role,
    message,
    notification_type
  )
  SELECT 
    'policy',
    id,
    'ops',
    'Policy ' || policy_number || ' has been in underwriting for ' || 
    ROUND(EXTRACT(EPOCH FROM (now() - status_updated_at)) / 86400) || ' days',
    'underwriting_delay'
  FROM public.policies_new
  WHERE policy_status = 'Underwriting'
    AND EXTRACT(EPOCH FROM (now() - status_updated_at)) / 86400 > 5
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.entity_type = 'policy' 
        AND n.entity_id = policies_new.id
        AND n.notification_type = 'underwriting_delay'
        AND n.created_at > now() - INTERVAL '1 day'
    );
    
  RETURN updated_count;
END;
$$;