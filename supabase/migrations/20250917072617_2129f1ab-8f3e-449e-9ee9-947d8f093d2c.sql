-- Add total_rate column to motor_payout_grid table
ALTER TABLE public.motor_payout_grid 
ADD COLUMN total_rate numeric GENERATED ALWAYS AS (
  COALESCE(commission_rate, 0) + COALESCE(reward_rate, 0) + COALESCE(bonus_commission_rate, 0)
) STORED;

-- Add total_rate column to health_payout_grid table  
ALTER TABLE public.health_payout_grid
ADD COLUMN total_rate numeric GENERATED ALWAYS AS (
  COALESCE(commission_rate, 0) + COALESCE(reward_rate, 0) + COALESCE(bonus_commission_rate, 0)
) STORED;