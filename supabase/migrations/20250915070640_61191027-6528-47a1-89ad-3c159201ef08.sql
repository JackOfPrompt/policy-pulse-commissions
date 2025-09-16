-- Fix search path security issue for manual commission functions
-- Replace existing functions with secure versions that have fixed search_path

CREATE OR REPLACE FUNCTION public.manual_calculate_policy_commission(p_policy_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    commission_result RECORD;
    policy_record RECORD;
    premium_amount numeric;
    calculated_total_rate numeric;
BEGIN
    -- Get policy details
    SELECT * INTO policy_record FROM public.policies WHERE id = p_policy_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Policy not found with id: %', p_policy_id;
    END IF;
    
    -- Get premium amount (prefer premium_with_gst, fallback to premium_without_gst)
    premium_amount := COALESCE(policy_record.premium_with_gst, policy_record.premium_without_gst, 0);
    
    -- Only process if policy is active and has premium
    IF policy_record.policy_status = 'active' AND premium_amount > 0 THEN
        -- Get commission calculation
        SELECT * INTO commission_result FROM public.get_commission(p_policy_id);
        
        -- If a commission grid match exists
        IF commission_result.policy_id IS NOT NULL AND commission_result.commission_rate > 0 THEN
            -- Calculate total rate
            calculated_total_rate := commission_result.commission_rate + COALESCE(commission_result.reward_rate, 0);
            
            -- Insert or update policy_commissions table
            INSERT INTO public.policy_commissions (
                policy_id,
                org_id,
                product_type,
                grid_table,
                grid_id,
                commission_rate,
                reward_rate,
                total_rate,
                commission_amount,
                reward_amount,
                total_amount,
                created_by
            ) VALUES (
                commission_result.policy_id,
                policy_record.org_id,
                commission_result.product_type,
                commission_result.grid_table,
                commission_result.grid_id,
                commission_result.commission_rate,
                commission_result.reward_rate,
                calculated_total_rate,
                (premium_amount * commission_result.commission_rate / 100),
                (premium_amount * COALESCE(commission_result.reward_rate, 0) / 100),
                (premium_amount * calculated_total_rate / 100),
                policy_record.created_by
            )
            ON CONFLICT (policy_id) 
            DO UPDATE SET
                commission_rate = EXCLUDED.commission_rate,
                reward_rate = EXCLUDED.reward_rate,
                total_rate = EXCLUDED.total_rate,
                commission_amount = EXCLUDED.commission_amount,
                reward_amount = EXCLUDED.reward_amount,
                total_amount = EXCLUDED.total_amount,
                updated_at = now(),
                grid_table = EXCLUDED.grid_table,
                grid_id = EXCLUDED.grid_id;
        END IF;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_all_policy_commissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop through all active policies and recalculate their commissions
    FOR policy_record IN 
        SELECT id FROM public.policies WHERE policy_status = 'active'
    LOOP
        PERFORM public.manual_calculate_policy_commission(policy_record.id);
    END LOOP;
END;
$function$;