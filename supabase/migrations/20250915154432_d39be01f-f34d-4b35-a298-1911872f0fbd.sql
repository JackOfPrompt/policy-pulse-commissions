-- Fix provider name mismatch for motor policies
UPDATE motor_payout_grid 
SET provider = 'TATA AIG' 
WHERE provider = 'TATA' AND is_active = true;

-- Also add a more flexible provider matching for better coverage
-- Update the motor grid to handle partial matches by creating additional entries
INSERT INTO motor_payout_grid (
  org_id,
  product_type,
  product_subtype,
  provider,
  commission_rate,
  reward_rate,
  valid_from,
  is_active
)
SELECT DISTINCT
  mpg.org_id,
  mpg.product_type,
  mpg.product_subtype,
  'TATA AIG' as provider,
  mpg.commission_rate,
  mpg.reward_rate,
  mpg.valid_from,
  true
FROM motor_payout_grid mpg
WHERE mpg.provider = 'TATA' 
  AND mpg.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM motor_payout_grid mpg2 
    WHERE mpg2.provider = 'TATA AIG' 
      AND mpg2.org_id = mpg.org_id
      AND mpg2.product_type = mpg.product_type
  );