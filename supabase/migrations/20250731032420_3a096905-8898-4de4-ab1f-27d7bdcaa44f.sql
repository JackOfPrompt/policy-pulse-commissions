-- Add policy status enum
CREATE TYPE public.policy_status_enum AS ENUM (
  'Underwriting',
  'Issued', 
  'Rejected',
  'Cancelled',
  'Free Look Cancellation'
);

-- Add policy status tracking fields to policies_new table
ALTER TABLE public.policies_new 
ADD COLUMN policy_status public.policy_status_enum DEFAULT 'Underwriting',
ADD COLUMN status_updated_by uuid REFERENCES auth.users(id),
ADD COLUMN status_updated_at timestamp with time zone DEFAULT now();

-- Create policy status history table for audit trail
CREATE TABLE public.policy_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies_new(id) ON DELETE CASCADE,
  previous_status public.policy_status_enum,
  new_status public.policy_status_enum NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now(),
  notes text
);

-- Enable RLS on policy status history
ALTER TABLE public.policy_status_history ENABLE ROW LEVEL SECURITY;

-- Create policy for policy status history
CREATE POLICY "Admin can manage policy status history" 
ON public.policy_status_history 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- Create trigger to log status changes
CREATE OR REPLACE FUNCTION public.log_policy_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.policy_status IS DISTINCT FROM NEW.policy_status THEN
    INSERT INTO public.policy_status_history (
      policy_id,
      previous_status,
      new_status,
      updated_by
    ) VALUES (
      NEW.id,
      OLD.policy_status,
      NEW.policy_status,
      NEW.status_updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_policy_status_change
BEFORE UPDATE ON public.policies_new
FOR EACH ROW
EXECUTE FUNCTION public.log_policy_status_change();