-- Fix the recalc_policy_commission function to not set total_rate directly
-- since it should be calculated from commission_rate + reward_rate

CREATE OR REPLACE FUNCTION public.recalc_policy_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
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
            total_rate,
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
            calculated_total_rate,  -- Use calculated value instead of c.total_rate
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
            total_rate,
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
            calculated_total_rate,  -- Use calculated value instead of c.total_rate
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