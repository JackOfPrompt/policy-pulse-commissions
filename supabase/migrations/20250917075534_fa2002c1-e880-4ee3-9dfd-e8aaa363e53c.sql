-- Update provider_id in life_payout_grid by matching provider name/code
UPDATE life_payout_grid 
SET provider_id = p.id
FROM providers p
WHERE life_payout_grid.provider_id IS NULL 
  AND life_payout_grid.org_id = p.org_id
  AND (LOWER(life_payout_grid.provider) = LOWER(p.name) 
       OR LOWER(life_payout_grid.provider) = LOWER(p.code));

-- Update provider_id in health_payout_grid by matching provider name/code  
UPDATE health_payout_grid 
SET provider_id = p.id
FROM providers p
WHERE health_payout_grid.provider_id IS NULL 
  AND health_payout_grid.org_id = p.org_id
  AND (LOWER(health_payout_grid.provider) = LOWER(p.name) 
       OR LOWER(health_payout_grid.provider) = LOWER(p.code));

-- Update provider_id in motor_payout_grid by matching provider name/code
UPDATE motor_payout_grid 
SET provider_id = p.id
FROM providers p
WHERE motor_payout_grid.provider_id IS NULL 
  AND motor_payout_grid.org_id = p.org_id
  AND (LOWER(motor_payout_grid.provider) = LOWER(p.name) 
       OR LOWER(motor_payout_grid.provider) = LOWER(p.code));

-- Also update existing policies to have provider_id
UPDATE policies 
SET provider_id = p.id
FROM providers p
WHERE policies.provider_id IS NULL 
  AND policies.org_id = p.org_id
  AND policies.provider IS NOT NULL
  AND (LOWER(policies.provider) = LOWER(p.name) 
       OR LOWER(policies.provider) = LOWER(p.code));