-- Fix provider_id mismatch for TATA AIG payout grids
-- Update motor payout grid to use correct TATA AIG provider_id
UPDATE motor_payout_grid 
SET provider_id = '8707d02e-1b8b-41b5-ad92-c09b4a381c8e',
    updated_at = NOW()
WHERE provider_id = '81214a42-d751-4d0c-a4ea-65a5f0759c56' 
  AND LOWER(provider) = 'tata aig';

-- Update health payout grid to use correct TATA AIG provider_id  
UPDATE health_payout_grid
SET provider_id = '8707d02e-1b8b-41b5-ad92-c09b4a381c8e',
    updated_at = NOW() 
WHERE provider_id = '81214a42-d751-4d0c-a4ea-65a5f0759c56'
  AND LOWER(provider) = 'tata aig';

-- Also update life payout grid if any exist
UPDATE life_payout_grid
SET provider_id = '8707d02e-1b8b-41b5-ad92-c09b4a381c8e',
    updated_at = NOW()
WHERE provider_id = '81214a42-d751-4d0c-a4ea-65a5f0759c56' 
  AND LOWER(provider) LIKE '%tata%';