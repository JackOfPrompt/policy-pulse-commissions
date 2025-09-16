-- Add missing commission rate fields to commission_grids table
ALTER TABLE commission_grids 
ADD COLUMN IF NOT EXISTS base_commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate numeric DEFAULT 0;

-- Update existing commission_rate values to be base_commission_rate if they exist
UPDATE commission_grids 
SET base_commission_rate = commission_rate 
WHERE base_commission_rate = 0 AND commission_rate > 0;

-- Add effective date ranges for reward and bonus rates
ALTER TABLE commission_grids
ADD COLUMN IF NOT EXISTS reward_effective_from date,
ADD COLUMN IF NOT EXISTS reward_effective_to date,
ADD COLUMN IF NOT EXISTS bonus_effective_from date,
ADD COLUMN IF NOT EXISTS bonus_effective_to date;

-- Ensure all payout grids have consistent structure
-- Update health_payout_grid to ensure all fields exist
ALTER TABLE health_payout_grid
ADD COLUMN IF NOT EXISTS base_commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_commission_rate numeric DEFAULT 0;

-- Update life_payout_grid to ensure all fields exist  
ALTER TABLE life_payout_grid
ADD COLUMN IF NOT EXISTS base_commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_commission_rate numeric DEFAULT 0;

-- Update motor_payout_grid to ensure all fields exist
ALTER TABLE motor_payout_grid  
ADD COLUMN IF NOT EXISTS base_commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_commission_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_commission_rate numeric DEFAULT 0;