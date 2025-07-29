-- Update rule_conditions table to support new line-specific attributes
ALTER TABLE public.rule_conditions 
DROP CONSTRAINT rule_conditions_attribute_check;

-- Add the expanded list of attributes for all insurance lines
ALTER TABLE public.rule_conditions 
ADD CONSTRAINT rule_conditions_attribute_check 
CHECK (attribute IN (
  -- Motor Insurance
  'vehicleType', 'cubicCapacity', 'fuelType', 'policyTenure', 'ODComponent', 'TPComponent',
  -- Life Insurance  
  'policyTerm', 'premiumPaymentTerm', 'policyType', 'planCode', 'sumAssured',
  -- Health Insurance
  'planType', 'ageBand', 'riderIncluded', 'familySize',
  -- Commercial Insurance
  'coverageType', 'riskCategory', 'sumInsuredBand', 'tenure',
  -- Common across lines
  'paymentFrequency', 'premiumBand'
));

-- Create a table to store line-specific commission calculation rules
CREATE TABLE public.line_commission_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_of_business TEXT NOT NULL CHECK (line_of_business IN ('Motor', 'Life', 'Health', 'Commercial')),
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(line_of_business, config_key)
);

-- Enable RLS on line_commission_configs
ALTER TABLE public.line_commission_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for line_commission_configs
CREATE POLICY "Admins can manage all line commission configs" 
ON public.line_commission_configs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_line_commission_configs_updated_at
  BEFORE UPDATE ON public.line_commission_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert line-specific configuration data
INSERT INTO public.line_commission_configs (line_of_business, config_key, config_value, description) VALUES 

-- Motor Insurance Configs
('Motor', 'commission_components', '{"OD": true, "TP": false}', 'Motor commission paid only on OD component'),
('Motor', 'vehicle_types', '["Car", "Bike", "Commercial Vehicle", "Three Wheeler", "Two Wheeler"]', 'Supported vehicle types'),
('Motor', 'fuel_types', '["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]', 'Supported fuel types'),
('Motor', 'cubic_capacity_slabs', '[{"min": 0, "max": 1000, "label": "Up to 1000cc"}, {"min": 1001, "max": 1500, "label": "1001-1500cc"}, {"min": 1501, "max": 99999, "label": "Above 1500cc"}]', 'Engine capacity slabs'),

-- Life Insurance Configs  
('Life', 'policy_types', '["Term Life", "ULIP", "Endowment", "Whole Life", "Group Term", "Money Back"]', 'Life insurance product types'),
('Life', 'max_first_year_commission', '40', 'Maximum first year commission percentage'),
('Life', 'max_renewal_commission', '5', 'Maximum renewal commission percentage'),
('Life', 'term_slabs', '[{"min": 5, "max": 9, "first_year": 15, "renewal": 2}, {"min": 10, "max": 14, "first_year": 25, "renewal": 3}, {"min": 15, "max": 99, "first_year": 35, "renewal": 5}]', 'Commission slabs based on policy term'),

-- Health Insurance Configs
('Health', 'plan_types', '["Individual", "Family Floater", "Group", "Senior Citizen", "Critical Illness"]', 'Health insurance plan types'),
('Health', 'max_individual_commission', '15', 'Maximum commission for individual plans'),
('Health', 'max_group_commission', '7.5', 'Maximum commission for group plans'),
('Health', 'payment_frequency_multipliers', '{"Annual": 1.0, "Semi-Annual": 0.9, "Quarterly": 0.8, "Monthly": 0.7}', 'Payment frequency multipliers'),

-- Commercial Insurance Configs
('Commercial', 'coverage_types', '["Fire", "Property", "Marine", "Engineering", "Liability", "Motor Commercial"]', 'Commercial insurance coverage types'),
('Commercial', 'risk_categories', '["SME", "Large Risk", "High Hazard", "Standard Risk"]', 'Risk categories for commercial insurance'),
('Commercial', 'sum_insured_slabs', '[{"min": 0, "max": 1000000, "label": "Up to 10L"}, {"min": 1000001, "max": 5000000, "label": "10L-50L"}, {"min": 5000001, "max": 99999999, "label": "Above 50L"}]', 'Sum insured bands for commercial insurance');

-- Create indexes for better performance
CREATE INDEX idx_line_commission_configs_lob ON public.line_commission_configs(line_of_business);
CREATE INDEX idx_line_commission_configs_active ON public.line_commission_configs(is_active);