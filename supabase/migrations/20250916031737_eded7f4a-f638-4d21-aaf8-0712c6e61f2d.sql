-- Drop existing functions that need to be updated
DROP FUNCTION IF EXISTS public.get_commission(uuid);
DROP FUNCTION IF EXISTS public.calculate_commission_amount(uuid);

-- Recreate get_commission function with correct signature
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
    premium_amount := COALESCE(policy_record.premium_with_gst, policy_record.premium_without_gst, 0);

    -- Find matching commission grid
    SELECT cg.id, cg.commission_rate, COALESCE(cg.reward_rate, 0) as reward_rate
    INTO grid_record
    FROM commission_grids cg
    WHERE cg.org_id = policy_record.org_id
      AND cg.product_type = policy_record.product_category
      AND (cg.min_premium IS NULL OR premium_amount >= cg.min_premium)
      AND (cg.max_premium IS NULL OR premium_amount <= cg.max_premium)
      AND CURRENT_DATE >= cg.effective_from
      AND (cg.effective_to IS NULL OR CURRENT_DATE <= cg.effective_to)
    ORDER BY cg.created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT 
            p_policy_id,
            grid_record.commission_rate,
            grid_record.reward_rate,
            (grid_record.commission_rate + grid_record.reward_rate),
            policy_record.product_category,
            'commission_grids'::text,
            grid_record.id;
    END IF;
END;
$function$;

-- Recreate calculate_commission_amount function with correct signature
CREATE OR REPLACE FUNCTION public.calculate_commission_amount(policy_id_param uuid)
 RETURNS TABLE(commission_rate numeric, reward_rate numeric, total_rate numeric, commission_amount numeric, reward_amount numeric, total_amount numeric, premium_base numeric, product_type text, calculation_status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    policy_data RECORD;
    grid_data RECORD;
    premium numeric := 0;
    commission numeric := 0;
    reward numeric := 0;
BEGIN
    -- Get policy with product type
    SELECT p.*, pt.category as product_category, pt.name as product_name
    INTO policy_data
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    WHERE p.id = policy_id_param;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, ''::text, 'policy_not_found'::text;
        RETURN;
    END IF;

    -- Get premium
    premium := COALESCE(policy_data.premium_with_gst, policy_data.premium_without_gst, 0);

    -- Find commission grid
    SELECT cg.*
    INTO grid_data
    FROM commission_grids cg
    WHERE cg.org_id = policy_data.org_id
      AND cg.product_type = policy_data.product_category
      AND (cg.min_premium IS NULL OR premium >= cg.min_premium)
      AND (cg.max_premium IS NULL OR premium <= cg.max_premium)
      AND CURRENT_DATE >= cg.effective_from
      AND (cg.effective_to IS NULL OR CURRENT_DATE <= cg.effective_to)
    ORDER BY cg.created_at DESC
    LIMIT 1;

    IF FOUND THEN
        commission := premium * grid_data.commission_rate / 100;
        reward := premium * COALESCE(grid_data.reward_rate, 0) / 100;
        
        RETURN QUERY SELECT 
            grid_data.commission_rate, 
            COALESCE(grid_data.reward_rate, 0)::numeric,
            (grid_data.commission_rate + COALESCE(grid_data.reward_rate, 0))::numeric,
            commission, 
            reward,
            (commission + reward)::numeric,
            premium, 
            policy_data.product_category,
            'calculated'::text;
    ELSE
        RETURN QUERY SELECT 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, premium, policy_data.product_category, 'no_grid'::text;
    END IF;
END;
$function$;