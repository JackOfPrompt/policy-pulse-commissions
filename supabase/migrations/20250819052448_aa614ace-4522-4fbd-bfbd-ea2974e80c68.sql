-- User Authentication and Onboarding System Migration

-- 1. Create user_accounts table to link auth.users with tenant employees/agents
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  employee_id uuid REFERENCES public.tenant_employees(id),
  agent_id bigint REFERENCES public.agents(agent_id),
  user_type text NOT NULL CHECK (user_type IN ('employee', 'agent', 'admin')),
  role text NOT NULL,
  must_change_password boolean DEFAULT true,
  password_changed_at timestamp with time zone,
  last_login_at timestamp with time zone,
  login_attempts integer DEFAULT 0,
  account_locked_until timestamp with time zone,
  is_active boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT user_accounts_entity_check CHECK (
    (user_type = 'employee' AND employee_id IS NOT NULL AND agent_id IS NULL) OR
    (user_type = 'agent' AND agent_id IS NOT NULL AND employee_id IS NULL) OR
    (user_type = 'admin' AND employee_id IS NOT NULL AND agent_id IS NULL)
  ),
  UNIQUE(auth_user_id),
  UNIQUE(tenant_id, employee_id),
  UNIQUE(tenant_id, agent_id)
);

-- 2. Create onboarding_invitations table to track invitation process
CREATE TABLE IF NOT EXISTS public.onboarding_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  employee_id uuid REFERENCES public.tenant_employees(id),
  agent_id bigint REFERENCES public.agents(agent_id),
  email text NOT NULL,
  invitation_token text UNIQUE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('employee', 'agent')),
  role text NOT NULL,
  temporary_password text,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  sent_at timestamp with time zone,
  accepted_at timestamp with time zone,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  CONSTRAINT onboarding_entity_check CHECK (
    (user_type = 'employee' AND employee_id IS NOT NULL AND agent_id IS NULL) OR
    (user_type = 'agent' AND agent_id IS NOT NULL AND employee_id IS NULL)
  )
);

-- 3. Add onboarding status columns to existing tables
ALTER TABLE public.tenant_employees 
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'invited', 'registered', 'active', 'inactive')),
ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS user_account_id uuid REFERENCES public.user_accounts(id);

ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'invited', 'registered', 'active', 'inactive')),
ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS user_account_id uuid REFERENCES public.user_accounts(id);

-- 4. Create function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token() 
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to generate temporary password
CREATE OR REPLACE FUNCTION generate_temp_password() 
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to handle user registration completion
CREATE OR REPLACE FUNCTION complete_user_onboarding(
  p_auth_user_id uuid,
  p_invitation_token text
) 
RETURNS jsonb AS $$
DECLARE
  v_invitation record;
  v_user_account_id uuid;
  v_result jsonb;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation 
  FROM public.onboarding_invitations 
  WHERE invitation_token = p_invitation_token 
  AND status = 'sent'
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Create user account record
  INSERT INTO public.user_accounts (
    auth_user_id,
    tenant_id,
    employee_id,
    agent_id,
    user_type,
    role,
    must_change_password,
    is_active,
    onboarding_completed
  ) VALUES (
    p_auth_user_id,
    v_invitation.tenant_id,
    v_invitation.employee_id,
    v_invitation.agent_id,
    v_invitation.user_type,
    v_invitation.role,
    true, -- Must change password on first login
    true,
    false
  ) RETURNING id INTO v_user_account_id;
  
  -- Update invitation status
  UPDATE public.onboarding_invitations 
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;
  
  -- Update employee/agent status and link user account
  IF v_invitation.user_type = 'employee' THEN
    UPDATE public.tenant_employees 
    SET onboarding_status = 'registered', user_account_id = v_user_account_id
    WHERE id = v_invitation.employee_id;
  ELSIF v_invitation.user_type = 'agent' THEN
    UPDATE public.agents 
    SET onboarding_status = 'registered', user_account_id = v_user_account_id
    WHERE agent_id = v_invitation.agent_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'user_account_id', v_user_account_id,
    'user_type', v_invitation.user_type,
    'tenant_id', v_invitation.tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to complete password change
CREATE OR REPLACE FUNCTION complete_password_change(
  p_auth_user_id uuid
) 
RETURNS jsonb AS $$
DECLARE
  v_user_account record;
BEGIN
  -- Get user account
  SELECT * INTO v_user_account 
  FROM public.user_accounts 
  WHERE auth_user_id = p_auth_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User account not found');
  END IF;
  
  -- Update password change status
  UPDATE public.user_accounts 
  SET 
    must_change_password = false,
    password_changed_at = now(),
    onboarding_completed = true,
    last_login_at = now()
  WHERE auth_user_id = p_auth_user_id;
  
  -- Update employee/agent status to active
  IF v_user_account.user_type = 'employee' THEN
    UPDATE public.tenant_employees 
    SET onboarding_status = 'active'
    WHERE id = v_user_account.employee_id;
  ELSIF v_user_account.user_type = 'agent' THEN
    UPDATE public.agents 
    SET onboarding_status = 'active'
    WHERE agent_id = v_user_account.agent_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'onboarding_completed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable RLS on new tables
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_invitations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for user_accounts
CREATE POLICY "user_accounts_own_record" ON public.user_accounts
FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY "user_accounts_tenant_admin" ON public.user_accounts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_accounts ua
    WHERE ua.auth_user_id = auth.uid()
    AND ua.tenant_id = user_accounts.tenant_id
    AND ua.role IN ('tenant_admin', 'system_admin')
  )
);

CREATE POLICY "user_accounts_system_admin" ON public.user_accounts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_accounts ua
    WHERE ua.auth_user_id = auth.uid()
    AND ua.role = 'system_admin'
  )
);

-- 10. Create RLS policies for onboarding_invitations
CREATE POLICY "invitations_tenant_admin" ON public.onboarding_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_accounts ua
    WHERE ua.auth_user_id = auth.uid()
    AND ua.tenant_id = onboarding_invitations.tenant_id
    AND ua.role IN ('tenant_admin', 'system_admin')
  )
);

CREATE POLICY "invitations_system_admin" ON public.onboarding_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_accounts ua
    WHERE ua.auth_user_id = auth.uid()
    AND ua.role = 'system_admin'
  )
);

-- 11. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_auth_user ON public.user_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_tenant ON public.user_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_employee ON public.user_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_agent ON public.user_accounts(agent_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.onboarding_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON public.onboarding_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.onboarding_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON public.onboarding_invitations(expires_at);

-- 12. Create updated_at triggers
DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON public.user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_invitations_updated_at ON public.onboarding_invitations;
CREATE TRIGGER update_onboarding_invitations_updated_at
    BEFORE UPDATE ON public.onboarding_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();