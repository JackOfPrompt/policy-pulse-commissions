-- Standardize field naming across all tables for consistency

-- 1. Standardize date fields in payout grids to use effective_from/effective_to
ALTER TABLE health_payout_grid RENAME COLUMN valid_from TO effective_from;
ALTER TABLE health_payout_grid RENAME COLUMN valid_to TO effective_to;

ALTER TABLE motor_payout_grid RENAME COLUMN valid_from TO effective_from;  
ALTER TABLE motor_payout_grid RENAME COLUMN valid_to TO effective_to;

-- life_payout_grid already has commission_start_date/commission_end_date for commission validity
-- and valid_from/valid_to for grid validity - keep both but standardize grid validity
ALTER TABLE life_payout_grid RENAME COLUMN valid_from TO grid_effective_from;
ALTER TABLE life_payout_grid RENAME COLUMN valid_to TO grid_effective_to;

-- 2. Standardize premium range fields to min_premium/max_premium
ALTER TABLE health_payout_grid ADD COLUMN min_premium numeric;
ALTER TABLE health_payout_grid ADD COLUMN max_premium numeric;

ALTER TABLE motor_payout_grid ADD COLUMN min_premium numeric;
ALTER TABLE motor_payout_grid ADD COLUMN max_premium numeric;

-- life_payout_grid already uses premium_start_price/premium_end_price - rename for consistency
ALTER TABLE life_payout_grid RENAME COLUMN premium_start_price TO min_premium;
ALTER TABLE life_payout_grid RENAME COLUMN premium_end_price TO max_premium;

-- 3. Standardize provider fields - ensure all grids have both provider (text) and provider_id (uuid)
-- health_payout_grid already has both
-- motor_payout_grid already has both  
-- life_payout_grid already has both

-- 4. Add missing commission fields for consistency across policy_commissions table
-- Ensure all commission amount fields are present and properly named
-- The table already has the main fields, but let's ensure consistency

-- 5. Standardize organization reference naming
-- Most tables use org_id consistently - no changes needed

-- 6. Add indexes for better performance on the new standardized fields
CREATE INDEX IF NOT EXISTS idx_health_payout_grid_effective_dates ON health_payout_grid(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_health_payout_grid_premium_range ON health_payout_grid(min_premium, max_premium);

CREATE INDEX IF NOT EXISTS idx_motor_payout_grid_effective_dates ON motor_payout_grid(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_motor_payout_grid_premium_range ON motor_payout_grid(min_premium, max_premium);

CREATE INDEX IF NOT EXISTS idx_life_payout_grid_grid_effective_dates ON life_payout_grid(grid_effective_from, grid_effective_to);
CREATE INDEX IF NOT EXISTS idx_life_payout_grid_premium_range ON life_payout_grid(min_premium, max_premium);

-- 7. Update any existing data to maintain compatibility
-- Copy sum insured ranges to premium ranges for health policies where applicable
UPDATE health_payout_grid SET 
  min_premium = sum_insured_min,
  max_premium = sum_insured_max
WHERE min_premium IS NULL AND sum_insured_min IS NOT NULL;

-- 8. Create view for backward compatibility during transition
CREATE OR REPLACE VIEW commission_grid_unified AS
SELECT 
  'commission_grids' as grid_type,
  id,
  org_id,
  product_type,
  product_subtype,
  provider,
  provider_id,
  min_premium,
  max_premium,
  commission_rate,
  0 as reward_rate,
  effective_from,
  effective_to,
  created_at,
  updated_at
FROM commission_grids
UNION ALL
SELECT 
  'health_payout_grid' as grid_type,
  id,
  org_id,
  product_type,
  product_sub_type as product_subtype,
  provider,
  provider_id,
  min_premium,
  max_premium,
  commission_rate,
  reward_rate,
  effective_from,
  effective_to,
  created_at,
  updated_at
FROM health_payout_grid
UNION ALL
SELECT 
  'motor_payout_grid' as grid_type,
  id,
  org_id,
  product_type,
  product_subtype,
  provider,
  provider_id,
  min_premium,
  max_premium,
  commission_rate,
  reward_rate,
  effective_from,
  effective_to,
  created_at,
  updated_at
FROM motor_payout_grid
UNION ALL
SELECT 
  'life_payout_grid' as grid_type,
  id,
  org_id,
  product_type,
  product_sub_type as product_subtype,
  provider,
  provider_id,
  min_premium,
  max_premium,
  commission_rate,
  reward_rate,
  grid_effective_from as effective_from,
  grid_effective_to as effective_to,
  created_at,
  updated_at
FROM life_payout_grid;