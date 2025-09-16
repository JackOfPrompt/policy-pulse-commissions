-- Fix trigger issue and complete commission calculation update

-- 1. Drop existing triggers first
DROP TRIGGER IF EXISTS auto_calculate_enhanced_commission_splits_trigger ON policies;
DROP TRIGGER IF EXISTS auto_calculate_commission_splits_trigger ON policies;

-- 2. Create the enhanced trigger with a unique name
CREATE OR REPLACE FUNCTION auto_calculate_enhanced_commission_splits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only calculate for active policies with premium
  IF NEW.policy_status = 'active' AND COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, NEW.gross_premium, 0) > 0 THEN
    -- Call the enhanced commission sync for this specific policy
    PERFORM sync_enhanced_comprehensive_commissions(NEW.org_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create new trigger with unique name
CREATE TRIGGER enhanced_commission_calculation_trigger
  AFTER INSERT OR UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_enhanced_commission_splits();

-- 4. Create sync function for comprehensive commissions that works with existing structure
CREATE OR REPLACE FUNCTION sync_comprehensive_commissions_updated(p_org_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  commission_rec RECORD;
BEGIN
  -- Get current user's org if not provided
  IF p_org_id IS NULL THEN
    SELECT org_id INTO p_org_id
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    LIMIT 1;
  END IF;

  -- Insert/update commission records using enhanced calculation
  FOR commission_rec IN 
    SELECT * FROM calculate_enhanced_comprehensive_commission_report(p_org_id)
  LOOP
    -- Update policy_commissions table
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
      insurer_commission,
      agent_commission,
      misp_commission,
      employee_commission,
      broker_share,
      commission_status,
      calc_date
    )
    VALUES (
      commission_rec.policy_id,
      p_org_id,
      commission_rec.product_category,
      commission_rec.grid_table,
      commission_rec.grid_id,
      commission_rec.total_commission_rate,
      commission_rec.reward_commission_rate,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission * commission_rec.reward_commission_rate / 100,
      commission_rec.insurer_commission,
      commission_rec.insurer_commission,
      commission_rec.agent_commission,
      commission_rec.misp_commission,
      commission_rec.employee_commission,
      commission_rec.broker_share,
      'calculated',
      commission_rec.calc_date
    )
    ON CONFLICT (policy_id) 
    WHERE is_active = true
    DO UPDATE SET
      commission_rate = EXCLUDED.commission_rate,
      reward_rate = EXCLUDED.reward_rate,
      commission_amount = EXCLUDED.commission_amount,
      insurer_commission = EXCLUDED.insurer_commission,
      agent_commission = EXCLUDED.agent_commission,
      misp_commission = EXCLUDED.misp_commission,
      employee_commission = EXCLUDED.employee_commission,
      broker_share = EXCLUDED.broker_share,
      grid_table = EXCLUDED.grid_table,
      grid_id = EXCLUDED.grid_id,
      commission_status = 'calculated',
      calc_date = EXCLUDED.calc_date,
      updated_at = NOW();
  END LOOP;
END;
$$;

-- 5. Add reporting manager columns if they don't exist
DO $$ 
BEGIN
    -- Add reporting_manager_id to agents table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'reporting_manager_id'
    ) THEN
        ALTER TABLE agents ADD COLUMN reporting_manager_id UUID REFERENCES employees(id);
    END IF;
    
    -- Add reporting_manager_name to agents table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'reporting_manager_name'
    ) THEN
        ALTER TABLE agents ADD COLUMN reporting_manager_name TEXT;
    END IF;
    
    -- Add reporting_manager_id to misps table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'misps' AND column_name = 'reporting_manager_id'
    ) THEN
        ALTER TABLE misps ADD COLUMN reporting_manager_id UUID REFERENCES employees(id);
    END IF;
    
    -- Add reporting_manager_name to misps table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'misps' AND column_name = 'reporting_manager_name'
    ) THEN
        ALTER TABLE misps ADD COLUMN reporting_manager_name TEXT;
    END IF;
END $$;