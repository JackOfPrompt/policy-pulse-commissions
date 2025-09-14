-- Fix security warning by setting search_path
CREATE OR REPLACE FUNCTION get_commission(p_policy_id uuid)
RETURNS TABLE (
    policy_id uuid,
    product_type text,
    commission_rate numeric,
    reward_rate numeric,
    total_rate numeric
) AS $$
DECLARE
    p_type text;
    p_subtype text;
    p_provider text;
    p_plan_name text;
    p_plan_type text;
    p_suminsured numeric;
    p_premium numeric;
    p_ppt int;
    p_pt int;
BEGIN
    -- 1. Get policy type & details
    SELECT pt.category, pt.name, p.provider, p.plan_name, 
           COALESCE(lpd.plan_type, hpd.policy_type, mpd.policy_type) as plan_type,
           COALESCE(p.dynamic_details->>'sum_insured', '0')::numeric,
           COALESCE(p.premium_with_gst, p.premium_without_gst, 0)
    INTO p_type, p_subtype, p_provider, p_plan_name, p_plan_type,
         p_suminsured, p_premium
    FROM policies p
    JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN life_policy_details lpd ON lpd.policy_id = p.id
    LEFT JOIN health_policy_details hpd ON hpd.policy_id = p.id
    LEFT JOIN motor_policy_details mpd ON mpd.policy_id = p.id
    WHERE p.id = p_policy_id;

    -- 2. Handle Motor (special rules)
    IF p_type = 'motor' THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, mpg.commission_rate,
               COALESCE(mpg.reward_rate, 0)::numeric AS reward_rate,
               (mpg.commission_rate + COALESCE(mpg.reward_rate, 0))::numeric AS total_rate
        FROM motor_payout_grid mpg
        JOIN motor_policy_details mpd ON mpd.policy_id = p_policy_id
        LEFT JOIN vehicles v ON v.id = mpd.vehicle_id
        WHERE mpg.product_type = p_type
          AND mpg.product_subtype = COALESCE(mpd.policy_sub_type, p_subtype)
          AND mpg.provider = p_provider
          AND (mpg.vehicle_make IS NULL OR mpg.vehicle_make = COALESCE(v.make, ''))
          AND (mpg.fuel_type_id IS NULL OR mpg.fuel_type_id::text = COALESCE(v.fuel_type, ''))
          AND (mpg.cc_range IS NULL OR mpg.cc_range = COALESCE(v.cc::text, ''))
          AND (mpg.ncb_percentage IS NULL OR mpg.ncb_percentage = COALESCE(mpd.ncb, 0))
          AND (mpg.coverage_type_id IS NULL OR mpg.coverage_type_id::text = COALESCE(mpd.policy_type, ''))
          AND mpg.is_active = true
          AND CURRENT_DATE BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, CURRENT_DATE)
        ORDER BY mpg.created_at DESC
        LIMIT 1;

    -- 3. Handle Health
    ELSIF p_type = 'health' THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, hpg.commission_rate,
               COALESCE(hpg.reward_rate, 0)::numeric AS reward_rate,
               (hpg.commission_rate + COALESCE(hpg.reward_rate, 0))::numeric AS total_rate
        FROM health_payout_grid hpg
        JOIN health_policy_details hpd ON hpd.policy_id = p_policy_id
        WHERE hpg.product_type = p_type
          AND hpg.product_sub_type = COALESCE(hpd.policy_type, p_subtype)
          AND hpg.provider = p_provider
          AND hpg.plan_name = p_plan_name
          AND (
            (hpg.sum_insured_min IS NULL AND hpg.sum_insured_max IS NULL)
            OR 
            (p_suminsured BETWEEN COALESCE(hpg.sum_insured_min, 0) AND COALESCE(hpg.sum_insured_max, 999999999))
          )
          AND hpg.is_active = true
          AND CURRENT_DATE BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, CURRENT_DATE)
        ORDER BY hpg.created_at DESC
        LIMIT 1;

    -- 4. Handle Life
    ELSIF p_type = 'life' THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, lpg.commission_rate,
               COALESCE(lpg.reward_rate, 0)::numeric AS reward_rate,
               COALESCE(lpg.total_rate, lpg.commission_rate + COALESCE(lpg.reward_rate, 0))::numeric AS total_rate
        FROM life_payout_grid lpg
        JOIN life_policy_details lpd ON lpd.policy_id = p_policy_id
        WHERE lpg.product_type = p_type
          AND (lpg.product_sub_type IS NULL OR lpg.product_sub_type = COALESCE(lpd.plan_type, p_subtype))
          AND lpg.provider = p_provider
          AND (lpg.plan_type IS NULL OR lpg.plan_type = COALESCE(lpd.plan_type, ''))
          AND (lpg.plan_name IS NULL OR lpg.plan_name = p_plan_name)
          AND (lpg.ppt IS NULL OR lpg.ppt = COALESCE(lpd.premium_payment_term, 0))
          AND (lpg.pt IS NULL OR lpg.pt = COALESCE(lpd.policy_term, 0))
          AND (
            (lpg.premium_start_price IS NULL AND lpg.premium_end_price IS NULL)
            OR 
            (p_premium BETWEEN COALESCE(lpg.premium_start_price, 0) AND COALESCE(lpg.premium_end_price, 999999999))
          )
          AND lpg.is_active = true
          AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
        ORDER BY lpg.created_at DESC
        LIMIT 1;

    -- 5. Handle All Future Products (fallback to 0 for now)
    ELSE
        RETURN QUERY
        SELECT p_policy_id, p_type, 0::numeric AS commission_rate,
               0::numeric AS reward_rate,
               0::numeric AS total_rate;
    END IF;
    
    -- If no results found, return zero rates
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, 0::numeric AS commission_rate,
               0::numeric AS reward_rate,
               0::numeric AS total_rate;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;