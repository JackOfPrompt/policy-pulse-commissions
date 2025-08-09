-- Make irdai_code nullable and add default coverage_type values
ALTER TABLE insurance_providers 
ALTER COLUMN irdai_code DROP NOT NULL;

-- Drop the existing coverage_type check constraint if it exists
ALTER TABLE insurance_products 
DROP CONSTRAINT IF EXISTS insurance_products_coverage_type_check;

-- Add a more flexible check constraint for coverage_type with safe defaults
ALTER TABLE insurance_products 
ADD CONSTRAINT insurance_products_coverage_type_check 
CHECK (coverage_type IN ('Comprehensive', 'Third Party', 'Standard', 'Basic', 'Premium', 'Individual', 'Family', 'Group'));

-- Set default values for critical fields to prevent constraint violations
ALTER TABLE insurance_products 
ALTER COLUMN coverage_type SET DEFAULT 'Standard';

ALTER TABLE insurance_products 
ALTER COLUMN category SET DEFAULT 'General';

-- Update existing NULL coverage_type values to use default
UPDATE insurance_products 
SET coverage_type = 'Standard' 
WHERE coverage_type IS NULL;

-- Add a flag to track auto-created providers for later review
ALTER TABLE insurance_providers 
ADD COLUMN IF NOT EXISTS is_auto_created BOOLEAN DEFAULT FALSE;

-- Create a table to log incomplete entries for admin review
CREATE TABLE IF NOT EXISTS incomplete_provider_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES insurance_providers(id),
  missing_fields TEXT[],
  created_during TEXT, -- 'bulk_upload' or 'manual_creation'
  needs_review BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on the new table
ALTER TABLE incomplete_provider_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to incomplete entries
CREATE POLICY "Admin can manage incomplete entries" 
ON incomplete_provider_entries 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));