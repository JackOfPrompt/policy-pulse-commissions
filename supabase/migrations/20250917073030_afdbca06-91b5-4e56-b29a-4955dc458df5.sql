-- Update existing records in life_payout_grid to populate provider_id and product_type_id
UPDATE public.life_payout_grid 
SET provider_id = (SELECT id FROM providers WHERE name = life_payout_grid.provider LIMIT 1),
    product_type_id = (SELECT id FROM product_types WHERE category = life_payout_grid.product_type LIMIT 1)
WHERE provider_id IS NULL OR product_type_id IS NULL;

-- Update existing records in motor_payout_grid to populate provider_id and product_type_id  
UPDATE public.motor_payout_grid
SET provider_id = (SELECT id FROM providers WHERE name = motor_payout_grid.provider LIMIT 1),
    product_type_id = (SELECT id FROM product_types WHERE category = motor_payout_grid.product_type LIMIT 1)
WHERE provider_id IS NULL OR product_type_id IS NULL;

-- Update existing records in health_payout_grid to populate provider_id and product_type_id
UPDATE public.health_payout_grid
SET provider_id = (SELECT id FROM providers WHERE name = health_payout_grid.provider LIMIT 1),
    product_type_id = (SELECT id FROM product_types WHERE category = health_payout_grid.product_type LIMIT 1)
WHERE provider_id IS NULL OR product_type_id IS NULL;

-- Create function to auto-populate provider_id and product_type_id
CREATE OR REPLACE FUNCTION public.auto_populate_payout_grid_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate provider_id from provider name
  IF NEW.provider IS NOT NULL AND NEW.provider_id IS NULL THEN
    SELECT id INTO NEW.provider_id 
    FROM providers 
    WHERE name = NEW.provider 
    LIMIT 1;
  END IF;
  
  -- Auto-populate product_type_id from product_type category
  IF NEW.product_type IS NOT NULL AND NEW.product_type_id IS NULL THEN
    SELECT id INTO NEW.product_type_id 
    FROM product_types 
    WHERE category = NEW.product_type 
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for life_payout_grid
CREATE TRIGGER auto_populate_life_payout_grid_ids
  BEFORE INSERT OR UPDATE ON public.life_payout_grid
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_payout_grid_ids();

-- Create triggers for motor_payout_grid
CREATE TRIGGER auto_populate_motor_payout_grid_ids
  BEFORE INSERT OR UPDATE ON public.motor_payout_grid
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_payout_grid_ids();

-- Create triggers for health_payout_grid
CREATE TRIGGER auto_populate_health_payout_grid_ids
  BEFORE INSERT OR UPDATE ON public.health_payout_grid
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_payout_grid_ids();