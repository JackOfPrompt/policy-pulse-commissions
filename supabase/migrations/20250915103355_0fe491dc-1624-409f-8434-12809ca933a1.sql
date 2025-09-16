-- Fix commission calculation by creating a proper function to match policies with commission grids
-- and trigger commission calculation when policies are created/updated

-- Create improved commission calculation function
CREATE OR REPLACE FUNCTION public.calculate_policy_commission_with_grids(p_policy_id uuid)
RETURNS TABLE(
  policy_id uuid,
  commission_rate numeric,
  commission_amount numeric,
  matched_grid_id uuid,
  calculation_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  policy_rec record;
  grid_rec record;
  premium_amount numeric := 0;
  calculated_commission numeric := 0;
BEGIN
  -- Get policy details with product type and provider
  SELECT 
    p.*,
    pt.category as product_category,
    pt.name as product_name,
    c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name
  INTO policy_rec
  FROM policies p
  LEFT JOIN product_types pt ON pt.id = p.product_type_id
  LEFT JOIN customers c ON c.id = p.customer_id
  WHERE p.id = p_policy_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT p_policy_id, 0::numeric, 0::numeric, NULL::uuid, 'policy_not_found'::text;
    RETURN;
  END IF;

  -- Get premium amount (prefer with GST, fallback to without GST)
  premium_amount := COALESCE(policy_rec.premium_with_gst, policy_rec.premium_without_gst, 0);

  -- Find matching commission grid based on product type, provider, and premium range
  SELECT cg.*
  INTO grid_rec
  FROM commission_grids cg
  WHERE cg.org_id = policy_rec.org_id
    AND cg.product_type = policy_rec.product_category
    AND (cg.product_subtype IS NULL OR cg.product_subtype = policy_rec.product_name OR cg.product_subtype = policy_rec.provider)
    AND (cg.min_premium IS NULL OR premium_amount >= cg.min_premium)
    AND (cg.max_premium IS NULL OR premium_amount <= cg.max_premium)
    AND CURRENT_DATE >= cg.effective_from
    AND (cg.effective_to IS NULL OR CURRENT_DATE <= cg.effective_to)
  ORDER BY 
    CASE WHEN cg.product_subtype = policy_rec.provider THEN 1 ELSE 2 END,
    cg.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    calculated_commission := premium_amount * grid_rec.commission_rate / 100;
    
    RETURN QUERY SELECT 
      p_policy_id,
      grid_rec.commission_rate,
      calculated_commission,
      grid_rec.id,
      'calculated'::text;
  ELSE
    RETURN QUERY SELECT 
      p_policy_id,
      0::numeric,
      0::numeric,
      NULL::uuid,
      'no_grid_match'::text;
  END IF;
END;
$$;

-- Create function to recalculate all policy commissions
CREATE OR REPLACE FUNCTION public.recalculate_all_policy_commissions_with_grids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  policy_record record;
  commission_result record;
BEGIN
  -- Loop through all active policies
  FOR policy_record IN 
    SELECT id FROM policies WHERE policy_status = 'active'
  LOOP
    -- Get commission calculation
    SELECT * INTO commission_result 
    FROM calculate_policy_commission_with_grids(policy_record.id);
    
    -- Update or insert commission record
    INSERT INTO policy_commissions (
      policy_id,
      org_id,
      product_type,
      commission_rate,
      commission_amount,
      total_amount,
      grid_id,
      commission_status,
      created_by
    )
    SELECT 
      commission_result.policy_id,
      (SELECT org_id FROM policies WHERE id = commission_result.policy_id),
      (SELECT pt.category FROM policies p JOIN product_types pt ON pt.id = p.product_type_id WHERE p.id = commission_result.policy_id),
      commission_result.commission_rate,
      commission_result.commission_amount,
      commission_result.commission_amount,
      commission_result.matched_grid_id,
      commission_result.calculation_status,
      (SELECT created_by FROM policies WHERE id = commission_result.policy_id)
    ON CONFLICT (policy_id, version_no, is_active) 
    DO UPDATE SET
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount,
      total_amount = EXCLUDED.total_amount,
      grid_id = EXCLUDED.grid_id,
      commission_status = EXCLUDED.commission_status,
      updated_at = NOW();
  END LOOP;
END;
$$;

-- Create trigger to auto-calculate commissions when policies are inserted/updated
CREATE OR REPLACE FUNCTION public.auto_calculate_policy_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  commission_result record;
BEGIN
  -- Only calculate for active policies with premium
  IF NEW.policy_status = 'active' AND COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) > 0 THEN
    
    -- Get commission calculation
    SELECT * INTO commission_result 
    FROM calculate_policy_commission_with_grids(NEW.id);
    
    -- Insert/update commission record
    INSERT INTO policy_commissions (
      policy_id,
      org_id,
      product_type,
      commission_rate,
      commission_amount,
      total_amount,
      grid_id,
      commission_status,
      created_by
    ) VALUES (
      commission_result.policy_id,
      NEW.org_id,
      (SELECT category FROM product_types WHERE id = NEW.product_type_id),
      commission_result.commission_rate,
      commission_result.commission_amount,
      commission_result.commission_amount,
      commission_result.matched_grid_id,
      commission_result.calculation_status,
      NEW.created_by
    )
    ON CONFLICT (policy_id) 
    DO UPDATE SET
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount,
      total_amount = EXCLUDED.total_amount,
      grid_id = EXCLUDED.grid_id,
      commission_status = EXCLUDED.commission_status,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on policies table
DROP TRIGGER IF EXISTS trigger_auto_calculate_commission ON policies;
CREATE TRIGGER trigger_auto_calculate_commission
  AFTER INSERT OR UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_policy_commission();

-- Update commission grids table to include provider field
ALTER TABLE commission_grids 
ADD COLUMN IF NOT EXISTS provider text,
ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_commission_grids_lookup 
ON commission_grids(org_id, product_type, provider, effective_from, effective_to) 
WHERE effective_to IS NULL OR effective_to >= CURRENT_DATE;