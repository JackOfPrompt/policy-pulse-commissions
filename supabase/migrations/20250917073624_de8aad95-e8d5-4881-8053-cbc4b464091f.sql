-- Update the auto-populate function to match against both name and code columns
CREATE OR REPLACE FUNCTION public.auto_populate_payout_grid_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate provider_id from provider name or code (case-insensitive)
  IF NEW.provider IS NOT NULL AND NEW.provider_id IS NULL THEN
    SELECT id INTO NEW.provider_id 
    FROM providers 
    WHERE LOWER(name) = LOWER(NEW.provider) 
       OR LOWER(code) = LOWER(NEW.provider)
    LIMIT 1;
  END IF;
  
  -- Auto-populate product_type_id from product_type category (case-insensitive)
  IF NEW.product_type IS NOT NULL AND NEW.product_type_id IS NULL THEN
    SELECT id INTO NEW.product_type_id 
    FROM product_types 
    WHERE LOWER(category) = LOWER(NEW.product_type) 
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update existing records with case-insensitive matching against name and code
UPDATE public.life_payout_grid 
SET provider_id = (
  SELECT id FROM providers 
  WHERE LOWER(name) = LOWER(life_payout_grid.provider) 
     OR LOWER(code) = LOWER(life_payout_grid.provider)
  LIMIT 1
),
product_type_id = (
  SELECT id FROM product_types 
  WHERE LOWER(category) = LOWER(life_payout_grid.product_type) 
  LIMIT 1
)
WHERE provider_id IS NULL OR product_type_id IS NULL;

UPDATE public.motor_payout_grid
SET provider_id = (
  SELECT id FROM providers 
  WHERE LOWER(name) = LOWER(motor_payout_grid.provider) 
     OR LOWER(code) = LOWER(motor_payout_grid.provider)
  LIMIT 1
),
product_type_id = (
  SELECT id FROM product_types 
  WHERE LOWER(category) = LOWER(motor_payout_grid.product_type) 
  LIMIT 1
)
WHERE provider_id IS NULL OR product_type_id IS NULL;

UPDATE public.health_payout_grid
SET provider_id = (
  SELECT id FROM providers 
  WHERE LOWER(name) = LOWER(health_payout_grid.provider) 
     OR LOWER(code) = LOWER(health_payout_grid.provider)
  LIMIT 1
),
product_type_id = (
  SELECT id FROM product_types 
  WHERE LOWER(category) = LOWER(health_payout_grid.product_type) 
  LIMIT 1
)
WHERE provider_id IS NULL OR product_type_id IS NULL;