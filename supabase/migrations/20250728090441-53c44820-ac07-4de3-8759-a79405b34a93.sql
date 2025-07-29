-- Add time-based fields to commission_rules table
ALTER TABLE public.commission_rules 
ADD COLUMN effective_to DATE,
ADD COLUMN frequency TEXT CHECK (frequency IN ('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Ad-hoc')) DEFAULT 'Yearly';

-- Rename effective_date to effective_from for clarity
ALTER TABLE public.commission_rules 
RENAME COLUMN effective_date TO effective_from;

-- Create function to check for overlapping commission rules
CREATE OR REPLACE FUNCTION public.check_commission_rule_overlap(
  p_insurer_id UUID,
  p_product_id UUID,
  p_line_of_business TEXT,
  p_effective_from DATE,
  p_effective_to DATE,
  p_rule_id UUID DEFAULT NULL
)
RETURNS TABLE(
  overlapping_rule_id UUID,
  overlapping_from DATE,
  overlapping_to DATE,
  overlapping_version INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.effective_from,
    cr.effective_to,
    cr.version
  FROM public.commission_rules cr
  WHERE 
    cr.insurer_id = p_insurer_id
    AND (cr.product_id = p_product_id OR (cr.product_id IS NULL AND p_product_id IS NULL))
    AND cr.line_of_business = p_line_of_business
    AND cr.is_active = true
    AND (p_rule_id IS NULL OR cr.id != p_rule_id)
    AND (
      -- Check for any overlap in date ranges
      (p_effective_to IS NULL OR cr.effective_from <= p_effective_to)
      AND (cr.effective_to IS NULL OR cr.effective_to >= p_effective_from)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get current active commission rules
CREATE OR REPLACE FUNCTION public.get_active_commission_rules(
  p_insurer_id UUID,
  p_product_id UUID DEFAULT NULL,
  p_line_of_business TEXT DEFAULT NULL,
  p_agent_tier_id UUID DEFAULT NULL,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  rule_id UUID,
  insurer_id UUID,
  product_id UUID,
  line_of_business TEXT,
  rule_type TEXT,
  first_year_rate NUMERIC,
  first_year_amount NUMERIC,
  renewal_rate NUMERIC,
  renewal_amount NUMERIC,
  effective_from DATE,
  effective_to DATE,
  version INTEGER,
  frequency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.insurer_id,
    cr.product_id,
    cr.line_of_business,
    cr.rule_type,
    cr.first_year_rate,
    cr.first_year_amount,
    cr.renewal_rate,
    cr.renewal_amount,
    cr.effective_from,
    cr.effective_to,
    cr.version,
    cr.frequency
  FROM public.commission_rules cr
  LEFT JOIN public.commission_rule_tiers crt ON cr.id = crt.commission_rule_id
  WHERE 
    cr.insurer_id = p_insurer_id
    AND (p_product_id IS NULL OR cr.product_id = p_product_id OR cr.product_id IS NULL)
    AND (p_line_of_business IS NULL OR cr.line_of_business = p_line_of_business)
    AND (p_agent_tier_id IS NULL OR crt.commission_tier_id = p_agent_tier_id OR NOT EXISTS (
      SELECT 1 FROM public.commission_rule_tiers WHERE commission_rule_id = cr.id
    ))
    AND cr.is_active = true
    AND cr.effective_from <= p_check_date
    AND (cr.effective_to IS NULL OR cr.effective_to >= p_check_date)
  ORDER BY cr.version DESC, cr.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to archive previous rule versions
CREATE OR REPLACE FUNCTION public.archive_previous_commission_rule_versions(
  p_insurer_id UUID,
  p_product_id UUID,
  p_line_of_business TEXT,
  p_new_effective_from DATE,
  p_exclude_rule_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update previous active rules to set effective_to and mark as inactive
  UPDATE public.commission_rules
  SET 
    effective_to = p_new_effective_from - INTERVAL '1 day',
    is_active = false,
    updated_at = now()
  WHERE 
    insurer_id = p_insurer_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
    AND line_of_business = p_line_of_business
    AND is_active = true
    AND effective_from < p_new_effective_from
    AND (effective_to IS NULL OR effective_to >= p_new_effective_from)
    AND (p_exclude_rule_id IS NULL OR id != p_exclude_rule_id);
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get next version number
CREATE OR REPLACE FUNCTION public.get_next_commission_rule_version(
  p_insurer_id UUID,
  p_product_id UUID,
  p_line_of_business TEXT
)
RETURNS INTEGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
  INTO max_version
  FROM public.commission_rules
  WHERE 
    insurer_id = p_insurer_id
    AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
    AND line_of_business = p_line_of_business;
    
  RETURN max_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add constraints and indexes for better performance
CREATE INDEX idx_commission_rules_temporal ON public.commission_rules(effective_from, effective_to, is_active);
CREATE INDEX idx_commission_rules_version ON public.commission_rules(insurer_id, product_id, line_of_business, version);

-- Create a view for current active rules
CREATE OR REPLACE VIEW public.active_commission_rules AS
SELECT 
  cr.*,
  ip.provider_name,
  pr.name as product_name
FROM public.commission_rules cr
LEFT JOIN public.insurance_providers ip ON cr.insurer_id = ip.id
LEFT JOIN public.insurance_products pr ON cr.product_id = pr.id
WHERE 
  cr.is_active = true
  AND cr.effective_from <= CURRENT_DATE
  AND (cr.effective_to IS NULL OR cr.effective_to >= CURRENT_DATE);

-- Update existing rules to have default frequency
UPDATE public.commission_rules 
SET frequency = 'Yearly' 
WHERE frequency IS NULL;