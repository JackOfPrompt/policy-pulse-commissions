-- Fix security issue by setting search_path on the trigger function
CREATE OR REPLACE FUNCTION public.insert_policy_commission()
RETURNS TRIGGER AS $$
DECLARE
    commission_record RECORD;
    premium_amount numeric;
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
            -- Insert into policy_commissions table
            INSERT INTO policy_commissions (
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
                commission_record.policy_id,
                NEW.org_id,
                commission_record.product_type,
                commission_record.grid_table,
                commission_record.grid_id,
                commission_record.commission_rate,
                commission_record.reward_rate,
                COALESCE(commission_record.total_rate, commission_record.commission_rate + COALESCE(commission_record.reward_rate, 0)),
                (premium_amount * commission_record.commission_rate / 100),
                (premium_amount * COALESCE(commission_record.reward_rate, 0) / 100),
                (premium_amount * COALESCE(commission_record.total_rate, commission_record.commission_rate + COALESCE(commission_record.reward_rate, 0)) / 100),
                NEW.created_by
            )
            ON CONFLICT (policy_id) DO NOTHING; -- Prevent duplicates
        ELSE
            -- Log when no commission grid is found
            RAISE NOTICE 'No commission grid found for policy % with product type %', NEW.id, NEW.product_type_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;