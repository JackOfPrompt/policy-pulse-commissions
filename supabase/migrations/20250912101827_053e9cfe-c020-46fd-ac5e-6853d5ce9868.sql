-- Update get_commission function to ensure it returns the correct structure
-- (it already returns grid_table and grid_id, but let's make sure it's consistent)

-- Create/Replace trigger function to automatically insert policy commissions
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_insert_policy_commission ON policies;

-- Create the trigger to automatically insert commission records
CREATE TRIGGER trg_insert_policy_commission
AFTER INSERT ON policies
FOR EACH ROW
EXECUTE FUNCTION public.insert_policy_commission();

-- Also create an update trigger to handle status changes
DROP TRIGGER IF EXISTS trg_update_policy_commission ON policies;

CREATE TRIGGER trg_update_policy_commission
AFTER UPDATE ON policies
FOR EACH ROW
WHEN (OLD.policy_status != NEW.policy_status OR OLD.premium_with_gst != NEW.premium_with_gst OR OLD.premium_without_gst != NEW.premium_without_gst)
EXECUTE FUNCTION public.insert_policy_commission();

-- Add unique constraint to prevent duplicate commission records for the same policy
ALTER TABLE policy_commissions 
ADD CONSTRAINT unique_policy_commission 
UNIQUE (policy_id);

-- Create index for better performance on commission lookups
CREATE INDEX IF NOT EXISTS idx_policy_commissions_policy_id ON policy_commissions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_commissions_org_id ON policy_commissions(org_id);
CREATE INDEX IF NOT EXISTS idx_policy_commissions_payout_status ON policy_commissions(payout_status);