-- Create missing tables for provider-LOB relationships if they don't exist
CREATE TABLE IF NOT EXISTS provider_line_of_business (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_provider_id UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  line_of_business_id UUID NOT NULL REFERENCES line_of_business(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(insurance_provider_id, line_of_business_id)
);

-- Create product-vehicle type mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_motor_vehicle_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES insurance_products(id) ON DELETE CASCADE,
  vehicle_type_id UUID NOT NULL REFERENCES motor_vehicle_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, vehicle_type_id)
);

-- Add unique constraint for product code per provider
ALTER TABLE insurance_products 
DROP CONSTRAINT IF EXISTS unique_product_code_per_provider;

ALTER TABLE insurance_products 
ADD CONSTRAINT unique_product_code_per_provider 
UNIQUE (code, provider_id);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_insurance_products_name ON insurance_products(name);
CREATE INDEX IF NOT EXISTS idx_insurance_products_lob_id ON insurance_products(line_of_business_id);
CREATE INDEX IF NOT EXISTS idx_insurance_products_provider_id ON insurance_products(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_products_category ON insurance_products(category);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_name ON insurance_providers USING gin(to_tsvector('english', provider_name));
CREATE INDEX IF NOT EXISTS idx_line_of_business_name ON line_of_business USING gin(to_tsvector('english', name));

-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE provider_line_of_business ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_motor_vehicle_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for provider_line_of_business
CREATE POLICY "Admin can manage provider LOB mappings" ON provider_line_of_business
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- RLS policies for product_motor_vehicle_types
CREATE POLICY "Admin can manage product vehicle types" ON product_motor_vehicle_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create upload error logs table for tracking bulk upload issues
CREATE TABLE IF NOT EXISTS upload_error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_session_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  row_data JSONB NOT NULL,
  errors TEXT[] NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS and policies for upload_error_logs
ALTER TABLE upload_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage upload error logs" ON upload_error_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Update trigger for provider_line_of_business
CREATE TRIGGER update_provider_lob_updated_at
  BEFORE UPDATE ON provider_line_of_business
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();