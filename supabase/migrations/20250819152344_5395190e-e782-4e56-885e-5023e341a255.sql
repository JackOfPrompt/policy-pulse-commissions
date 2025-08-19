-- Fix remaining 10 functions with search_path issues
-- and drop security definer views

-- First, let's check which functions need fixing by recreating them with proper search_path

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix generate_invitation_token function
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$function$;

-- Fix generate_temp_password function
CREATE OR REPLACE FUNCTION public.generate_temp_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

-- Fix complete_user_onboarding function
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(p_auth_user_id uuid, p_invitation_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    WHERE employee_id = v_invitation.employee_id;
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
$function$;

-- Fix complete_password_change function
CREATE OR REPLACE FUNCTION public.complete_password_change(p_auth_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    WHERE employee_id = v_user_account.employee_id;
  ELSIF v_user_account.user_type = 'agent' THEN
    UPDATE public.agents 
    SET onboarding_status = 'active'
    WHERE agent_id = v_user_account.agent_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'onboarding_completed', true);
END;
$function$;

-- Fix check_user_permission function
CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id uuid, p_module text, p_action text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_role app_role;
  v_tenant_id UUID;
  v_global_allowed BOOLEAN := false;
  v_local_user_allowed BOOLEAN;
  v_local_role_allowed BOOLEAN;
BEGIN
  -- Get user role and tenant
  SELECT role, tenant_id INTO v_user_role, v_tenant_id
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check global permissions
  SELECT is_allowed INTO v_global_allowed
  FROM public.global_permissions
  WHERE role_name = v_user_role
    AND module = p_module
    AND action = p_action;
    
  -- Check local user-specific override
  SELECT is_allowed INTO v_local_user_allowed
  FROM public.local_permissions
  WHERE tenant_id = v_tenant_id
    AND user_id = p_user_id
    AND module = p_module
    AND action = p_action;
    
  -- Check local role-level override
  SELECT is_allowed INTO v_local_role_allowed
  FROM public.local_permissions
  WHERE tenant_id = v_tenant_id
    AND role_name = v_user_role
    AND user_id IS NULL
    AND module = p_module
    AND action = p_action;
  
  -- Resolution logic: user override > role override > global
  IF v_local_user_allowed IS NOT NULL THEN
    RETURN v_local_user_allowed;
  ELSIF v_local_role_allowed IS NOT NULL THEN
    RETURN v_local_role_allowed;
  ELSE
    RETURN COALESCE(v_global_allowed, false);
  END IF;
END;
$function$;

-- Fix update_commission_rules_updated_at function
CREATE OR REPLACE FUNCTION public.update_commission_rules_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;