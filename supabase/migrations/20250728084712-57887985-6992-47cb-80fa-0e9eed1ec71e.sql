-- Create commission_tiers table
CREATE TABLE public.commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  override_rate NUMERIC,
  multiplier NUMERIC DEFAULT 1.0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on commission_tiers
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

-- Create policy for commission_tiers
CREATE POLICY "Admins can manage all commission tiers" 
ON public.commission_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create commission_rules table
CREATE TABLE public.commission_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurer_id UUID NOT NULL REFERENCES public.insurance_providers(id),
  product_id UUID REFERENCES public.insurance_products(id),
  line_of_business TEXT NOT NULL CHECK (line_of_business IN ('Motor', 'Health', 'Life', 'Commercial')),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('Flat %', 'Fixed', 'Tiered', 'Premium-Based', 'Volume-Based')),
  first_year_rate NUMERIC,
  first_year_amount NUMERIC,
  renewal_rate NUMERIC,
  renewal_amount NUMERIC,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_commission_rates CHECK (
    (first_year_rate IS NOT NULL OR first_year_amount IS NOT NULL) OR
    (renewal_rate IS NOT NULL OR renewal_amount IS NOT NULL)
  )
);

-- Enable RLS on commission_rules
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for commission_rules
CREATE POLICY "Admins can manage all commission rules" 
ON public.commission_rules 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create rule_conditions table
CREATE TABLE public.rule_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_rule_id UUID NOT NULL REFERENCES public.commission_rules(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL CHECK (attribute IN ('vehicleType', 'coverageType', 'policyMode', 'policyTerm', 'PPT', 'policyType', 'premiumBand', 'paymentFrequency', 'sumAssured', 'ageBand')),
  operator TEXT NOT NULL CHECK (operator IN ('=', 'in', '>=', '<=', '>', '<', 'contains')),
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rule_conditions
ALTER TABLE public.rule_conditions ENABLE ROW LEVEL SECURITY;

-- Create policy for rule_conditions
CREATE POLICY "Admins can manage all rule conditions" 
ON public.rule_conditions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create rule_ranges table
CREATE TABLE public.rule_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_rule_id UUID NOT NULL REFERENCES public.commission_rules(id) ON DELETE CASCADE,
  min_value NUMERIC NOT NULL,
  max_value NUMERIC,
  commission_rate NUMERIC,
  commission_amount NUMERIC,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_range_commission CHECK (
    commission_rate IS NOT NULL OR commission_amount IS NOT NULL
  ),
  CONSTRAINT valid_range_values CHECK (
    max_value IS NULL OR min_value <= max_value
  )
);

-- Enable RLS on rule_ranges
ALTER TABLE public.rule_ranges ENABLE ROW LEVEL SECURITY;

-- Create policy for rule_ranges
CREATE POLICY "Admins can manage all rule ranges" 
ON public.rule_ranges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create commission_rule_tiers junction table
CREATE TABLE public.commission_rule_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_rule_id UUID NOT NULL REFERENCES public.commission_rules(id) ON DELETE CASCADE,
  commission_tier_id UUID NOT NULL REFERENCES public.commission_tiers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(commission_rule_id, commission_tier_id)
);

-- Enable RLS on commission_rule_tiers
ALTER TABLE public.commission_rule_tiers ENABLE ROW LEVEL SECURITY;

-- Create policy for commission_rule_tiers
CREATE POLICY "Admins can manage all commission rule tiers" 
ON public.commission_rule_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_commission_tiers_updated_at
  BEFORE UPDATE ON public.commission_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rule_conditions_updated_at
  BEFORE UPDATE ON public.rule_conditions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rule_ranges_updated_at
  BEFORE UPDATE ON public.rule_ranges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_commission_rules_insurer_product ON public.commission_rules(insurer_id, product_id);
CREATE INDEX idx_commission_rules_active_effective ON public.commission_rules(is_active, effective_date);
CREATE INDEX idx_commission_rules_lob ON public.commission_rules(line_of_business);
CREATE INDEX idx_rule_conditions_rule_id ON public.rule_conditions(commission_rule_id);
CREATE INDEX idx_rule_ranges_rule_id ON public.rule_ranges(commission_rule_id);

-- Insert default commission tiers
INSERT INTO public.commission_tiers (name, code, description) VALUES
('POSP Level 1', 'POSP_L1', 'Point of Sales Person - Level 1'),
('POSP Level 2', 'POSP_L2', 'Point of Sales Person - Level 2'),
('MISP Level 1', 'MISP_L1', 'Motor Insurance Service Provider - Level 1'),
('MISP Level 2', 'MISP_L2', 'Motor Insurance Service Provider - Level 2'),
('Corporate Agent', 'CORP_AGENT', 'Corporate Agent'),
('Individual Agent', 'IND_AGENT', 'Individual Agent'),
('Bancassurance', 'BANCA', 'Bancassurance Partner'),
('Digital Partner', 'DIGITAL', 'Digital Distribution Partner');