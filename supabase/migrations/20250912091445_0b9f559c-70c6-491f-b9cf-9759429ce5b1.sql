-- Create a comprehensive commission calculation function
CREATE OR REPLACE FUNCTION public.get_commission(policy_id_param UUID)
RETURNS TABLE (
  commission_rate NUMERIC,
  reward_rate NUMERIC,
  total_rate NUMERIC,
  product_type TEXT,
  calculation_status TEXT
) AS $$
DECLARE
  policy_record RECORD;
  motor_record RECORD;
  health_record RECORD;
  life_record RECORD;
  vehicle_record RECORD;
  result_commission NUMERIC := 0;
  result_reward NUMERIC := 0;
  result_total NUMERIC := 0;
  calc_status TEXT := 'No match found';
BEGIN
  -- Get the policy details with product type
  SELECT p.*, pt.category, pt.name as product_name, pt.code as product_code
  INTO policy_record
  FROM policies p
  JOIN product_types pt ON p.product_type_id = pt.id
  WHERE p.id = policy_id_param;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 'Unknown'::TEXT, 'Policy not found'::TEXT;
    RETURN;
  END IF;
  
  -- Branch based on product category
  CASE LOWER(policy_record.category)
    WHEN 'motor' THEN
      -- Get motor policy details and vehicle info
      SELECT mpd.*, v.*
      INTO motor_record
      FROM motor_policy_details mpd
      LEFT JOIN vehicles v ON mpd.vehicle_id = v.id
      WHERE mpd.policy_id = policy_id_param;
      
      -- Motor commission lookup
      SELECT mpg.commission_rate, COALESCE(mpg.reward_rate, 0)
      INTO result_commission, result_reward
      FROM motor_payout_grid mpg
      WHERE mpg.product_type = policy_record.category
        AND mpg.product_subtype = COALESCE(motor_record.policy_sub_type, '')
        AND mpg.provider = COALESCE(policy_record.provider, '')
        AND (mpg.vehicle_type_id IS NULL OR mpg.vehicle_type_id::text = COALESCE(motor_record.vehicle_id::text, ''))
        AND (mpg.fuel_type_id IS NULL OR mpg.fuel_type_id::text = COALESCE(motor_record.fuel_type, ''))
        AND (mpg.business_type_id IS NULL OR mpg.business_type_id::text = COALESCE(motor_record.policy_type, ''))
        AND (mpg.ncb_percentage IS NULL OR mpg.ncb_percentage = COALESCE(motor_record.ncb, 0))
        AND (mpg.coverage_type_id IS NULL OR mpg.coverage_type_id::text = COALESCE(motor_record.policy_type, ''))
        AND (mpg.vehicle_make IS NULL OR mpg.vehicle_make = COALESCE(motor_record.make, ''))
        AND CURRENT_DATE BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, CURRENT_DATE)
        AND mpg.is_active = true
      ORDER BY mpg.created_at DESC
      LIMIT 1;
      
      IF result_commission IS NOT NULL THEN
        calc_status := 'Motor commission calculated';
        result_total := result_commission + result_reward;
      END IF;
    
    WHEN 'health' THEN
      -- Get health policy details
      SELECT hpd.*
      INTO health_record
      FROM health_policy_details hpd
      WHERE hpd.policy_id = policy_id_param;
      
      -- Health commission lookup
      SELECT hpg.commission_rate, COALESCE(hpg.reward_rate, 0)
      INTO result_commission, result_reward
      FROM health_payout_grid hpg
      WHERE hpg.product_type = policy_record.category
        AND hpg.product_sub_type = COALESCE(health_record.policy_type, policy_record.product_name)
        AND hpg.provider = COALESCE(policy_record.provider, '')
        AND hpg.plan_name = COALESCE(policy_record.plan_name, '')
        AND (
          (hpg.sum_insured_min IS NULL AND hpg.sum_insured_max IS NULL)
          OR 
          (COALESCE(policy_record.dynamic_details->>'sum_insured', '0')::NUMERIC 
           BETWEEN COALESCE(hpg.sum_insured_min, 0) 
           AND COALESCE(hpg.sum_insured_max, 999999999))
        )
        AND CURRENT_DATE BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, CURRENT_DATE)
        AND hpg.is_active = true
      ORDER BY hpg.created_at DESC
      LIMIT 1;
      
      IF result_commission IS NOT NULL THEN
        calc_status := 'Health commission calculated';
        result_total := result_commission + result_reward;
      END IF;
    
    WHEN 'life' THEN
      -- Get life policy details
      SELECT lpd.*
      INTO life_record
      FROM life_policy_details lpd
      WHERE lpd.policy_id = policy_id_param;
      
      -- Life commission lookup
      SELECT lpg.commission_rate, COALESCE(lpg.reward_rate, 0), COALESCE(lpg.total_rate, 0)
      INTO result_commission, result_reward, result_total
      FROM life_payout_grid lpg
      WHERE lpg.product_type = policy_record.category
        AND lpg.product_sub_type = COALESCE(life_record.plan_type, policy_record.product_name)
        AND lpg.provider = COALESCE(policy_record.provider, '')
        AND lpg.plan_type = COALESCE(life_record.plan_type, '')
        AND lpg.plan_name = COALESCE(policy_record.plan_name, '')
        AND (lpg.ppt IS NULL OR lpg.ppt = COALESCE(life_record.premium_payment_term, 0))
        AND (lpg.pt IS NULL OR lpg.pt = COALESCE(life_record.policy_term, 0))
        AND (
          (lpg.premium_start_price IS NULL AND lpg.premium_end_price IS NULL)
          OR 
          (COALESCE(policy_record.premium_without_gst, 0) 
           BETWEEN COALESCE(lpg.premium_start_price, 0) 
           AND COALESCE(lpg.premium_end_price, 999999999))
        )
        AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
        AND lpg.is_active = true
      ORDER BY lpg.created_at DESC
      LIMIT 1;
      
      IF result_commission IS NOT NULL THEN
        calc_status := 'Life commission calculated';
        -- For life, use total_rate if available, otherwise sum commission + reward
        IF result_total IS NULL OR result_total = 0 THEN
          result_total := result_commission + result_reward;
        END IF;
      END IF;
    
    ELSE
      calc_status := 'Unsupported product type: ' || policy_record.category;
  END CASE;
  
  -- Return the results
  RETURN QUERY SELECT 
    COALESCE(result_commission, 0)::NUMERIC,
    COALESCE(result_reward, 0)::NUMERIC,
    COALESCE(result_total, 0)::NUMERIC,
    policy_record.category::TEXT,
    calc_status::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to calculate commission amount
CREATE OR REPLACE FUNCTION public.calculate_commission_amount(
  policy_id_param UUID
) RETURNS TABLE (
  commission_rate NUMERIC,
  reward_rate NUMERIC,
  total_rate NUMERIC,
  commission_amount NUMERIC,
  reward_amount NUMERIC,
  total_amount NUMERIC,
  premium_base NUMERIC,
  product_type TEXT,
  calculation_status TEXT
) AS $$
DECLARE
  commission_result RECORD;
  policy_premium NUMERIC := 0;
BEGIN
  -- Get commission rates
  SELECT * INTO commission_result FROM public.get_commission(policy_id_param);
  
  -- Get policy premium
  SELECT COALESCE(premium_without_gst, 0) 
  INTO policy_premium
  FROM policies 
  WHERE id = policy_id_param;
  
  -- Calculate amounts
  RETURN QUERY SELECT 
    commission_result.commission_rate,
    commission_result.reward_rate,
    commission_result.total_rate,
    (policy_premium * commission_result.commission_rate / 100)::NUMERIC as commission_amount,
    (policy_premium * commission_result.reward_rate / 100)::NUMERIC as reward_amount,
    (policy_premium * commission_result.total_rate / 100)::NUMERIC as total_amount,
    policy_premium,
    commission_result.product_type,
    commission_result.calculation_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;