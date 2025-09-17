-- Update commission calculation function to include premium values from policy details
DROP FUNCTION IF EXISTS calculate_comprehensive_commission_report_normalized;

CREATE OR REPLACE FUNCTION calculate_comprehensive_commission_report_normalized(p_org_id uuid DEFAULT NULL::uuid, p_policy_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  policy_id uuid,
  policy_number text,
  product_category text,
  product_name text,
  plan_name text,
  provider text,
  source_type text,
  grid_table text,
  grid_id uuid,
  commission_rate numeric,
  reward_rate numeric,
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  broker_share numeric,
  calc_date timestamp with time zone,
  premium_amount numeric,
  gross_premium numeric,
  premium_with_gst numeric,
  premium_without_gst numeric,
  customer_name text,
  agent_name text,
  employee_name text,
  misp_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  policy_record record;
  grid_data record;
  commission_splits record;
BEGIN
  -- Get policies with all premium details and related data
  FOR policy_record IN 
    SELECT 
      p.id,
      p.policy_number,
      p.premium_with_gst,
      p.premium_without_gst,
      p.gross_premium,
      p.plan_name,
      p.provider,
      p.source_type,
      p.agent_id,
      p.employee_id,
      p.misp_id,
      p.org_id,
      pt.category as product_category,
      pt.name as product_name,
      CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as customer_name,
      e.name as employee_name,
      a.agent_name,
      m.channel_partner_name as misp_name,
      p.created_at
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN employees e ON e.id = p.employee_id
    LEFT JOIN agents a ON a.id = p.agent_id
    LEFT JOIN misps m ON m.id = p.misp_id
    WHERE p.policy_status = 'active'
      AND (p_org_id IS NULL OR p.org_id = p_org_id)
      AND (p_policy_id IS NULL OR p.id = p_policy_id)
  LOOP
    -- Get commission calculation from existing policy_commissions or calculate new
    SELECT 
      pc.commission_rate,
      pc.reward_rate,
      pc.insurer_commission,
      pc.agent_commission,
      pc.misp_commission,
      pc.employee_commission,
      pc.broker_share,
      pc.grid_table,
      pc.grid_id,
      pc.calc_date
    INTO grid_data
    FROM policy_commissions pc
    WHERE pc.policy_id = policy_record.id
      AND pc.is_active = true
    LIMIT 1;

    -- If no commission data exists, calculate from grids
    IF grid_data IS NULL THEN
      -- Calculate commission splits for this policy
      SELECT * INTO commission_splits 
      FROM calculate_commission_splits(policy_record.id);
      
      IF commission_splits.policy_id IS NOT NULL THEN
        grid_data.commission_rate := commission_splits.commission_rate;
        grid_data.reward_rate := commission_splits.reward_rate;
        grid_data.insurer_commission := commission_splits.insurer_commission;
        grid_data.agent_commission := commission_splits.agent_commission;
        grid_data.misp_commission := commission_splits.misp_commission;
        grid_data.employee_commission := commission_splits.employee_commission;
        grid_data.broker_share := commission_splits.broker_share;
        grid_data.grid_table := commission_splits.grid_table;
        grid_data.grid_id := commission_splits.grid_id;
        grid_data.calc_date := NOW();
      ELSE
        -- No grid found, return zeros but still include policy data
        grid_data.commission_rate := 0;
        grid_data.reward_rate := 0;
        grid_data.insurer_commission := 0;
        grid_data.agent_commission := 0;
        grid_data.misp_commission := 0;
        grid_data.employee_commission := 0;
        grid_data.broker_share := 0;
        grid_data.grid_table := NULL;
        grid_data.grid_id := NULL;
        grid_data.calc_date := NOW();
      END IF;
    END IF;

    -- Return the row with all premium details
    RETURN QUERY SELECT
      policy_record.id,
      policy_record.policy_number,
      policy_record.product_category,
      policy_record.product_name,
      policy_record.plan_name,
      policy_record.provider,
      policy_record.source_type,
      COALESCE(grid_data.grid_table, ''),
      grid_data.grid_id,
      COALESCE(grid_data.commission_rate, 0),
      COALESCE(grid_data.reward_rate, 0),
      COALESCE(grid_data.insurer_commission, 0),
      COALESCE(grid_data.agent_commission, 0),
      COALESCE(grid_data.misp_commission, 0),
      COALESCE(grid_data.employee_commission, 0),
      COALESCE(grid_data.broker_share, 0),
      COALESCE(grid_data.calc_date, policy_record.created_at),
      COALESCE(policy_record.premium_with_gst, policy_record.premium_without_gst, policy_record.gross_premium, 0),
      COALESCE(policy_record.gross_premium, 0),
      COALESCE(policy_record.premium_with_gst, 0),
      COALESCE(policy_record.premium_without_gst, 0),
      policy_record.customer_name,
      policy_record.agent_name,
      policy_record.employee_name,
      policy_record.misp_name;
  END LOOP;
END;
$$;