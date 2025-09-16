-- Update functions to avoid inserting into generated column total_rate on policy_commissions
-- Ensures policy save works without commission side-effects writing to generated columns

CREATE OR REPLACE FUNCTION public.insert_policy_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    commission_record RECORD;
    premium_amount numeric;
    calculated_total_rate numeric;
BEGIN
    -- Get premium from the new policy (prefer premium_with_gst, fallback to premium_without_gst)
    premium_amount := COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0);

    -- Only process if policy is active and has premium
    IF NEW.policy_status = 'active' AND premium_amount > 0 THEN
        -- Run commission lookup
        SELECT * INTO commission_record
        FROM public.get_commission(NEW.id)
        LIMIT 1;

        -- If a commission grid match exists
        IF commission_record.policy_id IS NOT NULL AND commission_record.commission_rate > 0 THEN
            -- Calculate total rate instead of using the one from get_commission
            calculated_total_rate := commission_record.commission_rate + COALESCE(commission_record.reward_rate, 0);
            
            -- Insert into policy_commissions table WITHOUT explicit total_rate column
            INSERT INTO policy_commissions (
                policy_id,
                org_id,
                product_type,
                grid_table,
                grid_id,
                commission_rate,
                reward_rate,
                commission_amount,
                reward_amount,
                total_amount,
                created_by
            ) VALUES (
                commission_record.policy_id,
                NEW.org_id,
                commission_record.product_type,
                commission_record.grid_table,
                commission_record.grid_id,
                commission_record.commission_rate,
                commission_record.reward_rate,
                (premium_amount * commission_record.commission_rate / 100),
                (premium_amount * COALESCE(commission_record.reward_rate, 0) / 100),
                (premium_amount * calculated_total_rate / 100),
                NEW.created_by
            )
            ON CONFLICT (policy_id) DO NOTHING; -- Prevent duplicates
        ELSE
            RAISE NOTICE 'No commission grid found for policy % with product type %', NEW.id, NEW.product_type_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalc_policy_commission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
    c record;
    commission_amount numeric(12,2);
    reward_amount numeric(12,2);
    total_amount numeric(12,2);
    calculated_total_rate numeric(12,2);
    last_version integer;
BEGIN
    -- Fetch commission details using existing function
    SELECT * INTO c FROM get_commission(NEW.id) LIMIT 1;

    IF c.policy_id IS NULL THEN
        RAISE NOTICE 'No commission found for policy %', NEW.id;
        RETURN NEW;
    END IF;

    -- Calculate the total rate instead of getting it from the function
    calculated_total_rate := c.commission_rate + COALESCE(c.reward_rate, 0);

    commission_amount := (COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) * c.commission_rate / 100);
    reward_amount := (COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) * c.reward_rate / 100);
    total_amount := (COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) * calculated_total_rate / 100);

    IF TG_OP = 'INSERT' THEN
        -- First version always 1
        INSERT INTO policy_commissions (
            policy_id,
            org_id,
            version_no,
            product_type,
            grid_table,
            grid_id,
            commission_rate,
            reward_rate,
            commission_amount,
            reward_amount,
            total_amount,
            payout_status,
            valid_from,
            is_active,
            created_by
        )
        VALUES (
            NEW.id,
            NEW.org_id,
            1,
            c.product_type,
            c.grid_table,
            c.grid_id,
            c.commission_rate,
            c.reward_rate,
            commission_amount,
            reward_amount,
            total_amount,
            'pending',
            now(),
            true,
            NEW.created_by
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Close out old version
        UPDATE policy_commissions
        SET valid_to = now(),
            is_active = false
        WHERE policy_id = NEW.id
          AND is_active = true;

        -- Get last version number
        SELECT COALESCE(MAX(version_no), 0)
        INTO last_version
        FROM policy_commissions
        WHERE policy_id = NEW.id;

        -- Insert new version
        INSERT INTO policy_commissions (
            policy_id,
            org_id,
            version_no,
            product_type,
            grid_table,
            grid_id,
            commission_rate,
            reward_rate,
            commission_amount,
            reward_amount,
            total_amount,
            payout_status,
            valid_from,
            is_active,
            created_by
        )
        VALUES (
            NEW.id,
            NEW.org_id,
            last_version + 1,
            c.product_type,
            c.grid_table,
            c.grid_id,
            c.commission_rate,
            c.reward_rate,
            commission_amount,
            reward_amount,
            total_amount,
            'pending',
            now(),
            true,
            NEW.created_by
        );
    END IF;

    RETURN NEW;
END;
$function$;

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
            
            -- Insert or update policy_commissions table WITHOUT explicit total_rate column
            INSERT INTO public.policy_commissions (
                policy_id,
                org_id,
                product_type,
                grid_table,
                grid_id,
                commission_rate,
                reward_rate,
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
                (premium_amount * commission_result.commission_rate / 100),
                (premium_amount * COALESCE(commission_result.reward_rate, 0) / 100),
                (premium_amount * calculated_total_rate / 100),
                policy_record.created_by
            )
            ON CONFLICT (policy_id) 
            DO UPDATE SET
                commission_rate = EXCLUDED.commission_rate,
                reward_rate = EXCLUDED.reward_rate,
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