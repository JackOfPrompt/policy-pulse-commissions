-- Update the get_commission function to use the existing payout grid tables instead of commission_grids
CREATE OR REPLACE FUNCTION public.get_commission(p_policy_id uuid)
RETURNS TABLE(policy_id uuid, commission_rate numeric, reward_rate numeric, total_rate numeric, product_type text, grid_table text, grid_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    policy_record RECORD;
    grid_record RECORD;
    premium_amount numeric := 0;
BEGIN
    -- Get policy details
    SELECT p.*, pt.category as product_category, pt.name as product_name
    INTO policy_record
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    WHERE p.id = p_policy_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Get premium amount
    premium_amount := COALESCE(policy_record.premium_with_gst, policy_record.premium_without_gst, policy_record.gross_premium, 0);

    -- Find matching commission grid based on product type
    IF LOWER(policy_record.product_category) = 'life' THEN
        -- Check life_payout_grid
        SELECT lpg.id, lpg.commission_rate, COALESCE(lpg.reward_rate, 0) as reward_rate
        INTO grid_record
        FROM life_payout_grid lpg
        WHERE lpg.org_id = policy_record.org_id
          AND lpg.provider = policy_record.provider
          AND LOWER(lpg.product_type) = LOWER(policy_record.product_category)
          AND (lpg.min_premium IS NULL OR premium_amount >= lpg.min_premium)
          AND (lpg.max_premium IS NULL OR premium_amount <= lpg.max_premium)
          AND lpg.is_active = true
          AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
        ORDER BY lpg.created_at DESC
        LIMIT 1;
        
        IF FOUND THEN
            RETURN QUERY SELECT 
                p_policy_id,
                grid_record.commission_rate,
                grid_record.reward_rate,
                (grid_record.commission_rate + grid_record.reward_rate),
                policy_record.product_category,
                'life_payout_grid'::text,
                grid_record.id;
        END IF;
        
    ELSIF LOWER(policy_record.product_category) = 'health' THEN
        -- Check health_payout_grid
        SELECT hpg.id, hpg.commission_rate, COALESCE(hpg.reward_rate, 0) as reward_rate
        INTO grid_record
        FROM health_payout_grid hpg
        WHERE hpg.org_id = policy_record.org_id
          AND hpg.provider = policy_record.provider
          AND LOWER(hpg.product_type) = LOWER(policy_record.product_category)
          AND (hpg.min_premium IS NULL OR premium_amount >= hpg.min_premium)
          AND (hpg.max_premium IS NULL OR premium_amount <= hpg.max_premium)
          AND hpg.is_active = true
          AND CURRENT_DATE BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, CURRENT_DATE)
        ORDER BY hpg.created_at DESC
        LIMIT 1;
        
        IF FOUND THEN
            RETURN QUERY SELECT 
                p_policy_id,
                grid_record.commission_rate,
                grid_record.reward_rate,
                (grid_record.commission_rate + grid_record.reward_rate),
                policy_record.product_category,
                'health_payout_grid'::text,
                grid_record.id;
        END IF;
        
    ELSIF LOWER(policy_record.product_category) = 'motor' THEN
        -- Check motor_payout_grid
        SELECT mpg.id, mpg.commission_rate, COALESCE(mpg.reward_rate, 0) as reward_rate
        INTO grid_record
        FROM motor_payout_grid mpg
        WHERE mpg.org_id = policy_record.org_id
          AND mpg.provider = policy_record.provider
          AND LOWER(mpg.product_type) = LOWER(policy_record.product_category)
          AND (mpg.min_premium IS NULL OR premium_amount >= mpg.min_premium)
          AND (mpg.max_premium IS NULL OR premium_amount <= mpg.max_premium)
          AND mpg.is_active = true
          AND CURRENT_DATE BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, CURRENT_DATE)
        ORDER BY mpg.created_at DESC
        LIMIT 1;
        
        IF FOUND THEN
            RETURN QUERY SELECT 
                p_policy_id,
                grid_record.commission_rate,
                grid_record.reward_rate,
                (grid_record.commission_rate + grid_record.reward_rate),
                policy_record.product_category,
                'motor_payout_grid'::text,
                grid_record.id;
        END IF;
    END IF;
END;
$function$;