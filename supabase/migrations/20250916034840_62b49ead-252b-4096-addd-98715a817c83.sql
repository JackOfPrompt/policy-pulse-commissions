-- Add bonus_commission_rate to commission grid tables for complete commission structure
ALTER TABLE commission_grids 
ADD COLUMN bonus_commission_rate numeric DEFAULT 0;

ALTER TABLE motor_payout_grid 
ADD COLUMN bonus_commission_rate numeric DEFAULT 0;

ALTER TABLE life_payout_grid 
ADD COLUMN bonus_commission_rate numeric DEFAULT 0;

ALTER TABLE health_payout_grid 
ADD COLUMN bonus_commission_rate numeric DEFAULT 0;