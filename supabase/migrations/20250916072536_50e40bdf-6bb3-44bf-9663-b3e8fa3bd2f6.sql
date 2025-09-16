-- Clean up duplicate commission columns in payout grid tables

-- First, ensure commission_rate is populated from base_commission_rate if needed
UPDATE life_payout_grid 
SET commission_rate = COALESCE(base_commission_rate, commission_rate, 0)
WHERE commission_rate = 0 AND base_commission_rate > 0;

UPDATE health_payout_grid 
SET commission_rate = COALESCE(base_commission_rate, commission_rate, 0)
WHERE commission_rate = 0 AND base_commission_rate > 0;

UPDATE motor_payout_grid 
SET commission_rate = COALESCE(base_commission_rate, commission_rate, 0)
WHERE commission_rate = 0 AND base_commission_rate > 0;

-- Ensure reward_rate is populated from reward_commission_rate if needed
UPDATE life_payout_grid 
SET reward_rate = COALESCE(reward_commission_rate, reward_rate, 0)
WHERE reward_rate = 0 AND reward_commission_rate > 0;

UPDATE health_payout_grid 
SET reward_rate = COALESCE(reward_commission_rate, reward_rate, 0)
WHERE reward_rate = 0 AND reward_commission_rate > 0;

UPDATE motor_payout_grid 
SET reward_rate = COALESCE(reward_commission_rate, reward_rate, 0)
WHERE reward_rate = 0 AND reward_commission_rate > 0;

-- Drop the duplicate columns
ALTER TABLE life_payout_grid 
DROP COLUMN IF EXISTS base_commission_rate,
DROP COLUMN IF EXISTS reward_commission_rate;

ALTER TABLE health_payout_grid 
DROP COLUMN IF EXISTS base_commission_rate,
DROP COLUMN IF EXISTS reward_commission_rate;

ALTER TABLE motor_payout_grid 
DROP COLUMN IF EXISTS base_commission_rate,
DROP COLUMN IF EXISTS reward_commission_rate;