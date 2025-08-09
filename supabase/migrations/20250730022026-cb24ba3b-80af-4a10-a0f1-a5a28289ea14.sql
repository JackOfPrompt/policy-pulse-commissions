-- Create Line of Business enum and table
CREATE TYPE line_of_business_type AS ENUM ('Health', 'Motor', 'Life', 'Travel', 'Loan', 'Pet', 'Commercial');

CREATE TABLE public.line_of_business (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name line_of_business_type NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create policy type enum
CREATE TYPE policy_type_enum AS ENUM ('New', 'Renewal', 'Portability', 'Top-Up', 'Rollover', 'Converted');

-- Create motor vehicle type enum and table
CREATE TYPE motor_vehicle_type_enum AS ENUM ('Two-Wheeler', 'Private Car', 'Commercial Vehicle', 'Miscellaneous');

CREATE TABLE public.motor_vehicle_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name motor_vehicle_type_enum NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment mode enum
CREATE TYPE payment_mode_enum AS ENUM ('Cash', 'UPI', 'Cheque', 'Online', 'Bank Transfer');

-- Update insurance_providers table with new fields
ALTER TABLE public.insurance_providers 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Update insurance_products table
ALTER TABLE public.insurance_products
ADD COLUMN IF NOT EXISTS line_of_business_id UUID REFERENCES public.line_of_business(id),
ADD COLUMN IF NOT EXISTS uin TEXT,
ADD COLUMN IF NOT EXISTS is_standard_product BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS supported_policy_types policy_type_enum[] DEFAULT ARRAY['New']::policy_type_enum[],
ADD COLUMN IF NOT EXISTS effective_from DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS effective_to DATE;

-- Create junction table for motor vehicle types and products
CREATE TABLE public.product_motor_vehicle_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.insurance_products(id) ON DELETE CASCADE,
  vehicle_type_id UUID NOT NULL REFERENCES public.motor_vehicle_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, vehicle_type_id)
);

-- Update policies_new table with new fields
ALTER TABLE public.policies_new
ADD COLUMN IF NOT EXISTS policy_type policy_type_enum,
ADD COLUMN IF NOT EXISTS line_of_business_id UUID REFERENCES public.line_of_business(id),
ADD COLUMN IF NOT EXISTS vehicle_type_id UUID REFERENCES public.motor_vehicle_types(id),
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS sum_insured NUMERIC,
ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN GENERATED ALWAYS AS (policy_type = 'Renewal') STORED,
ADD COLUMN IF NOT EXISTS previous_policy_number TEXT,
ADD COLUMN IF NOT EXISTS payment_mode payment_mode_enum;

-- Update commission_rules table to support new filtering
ALTER TABLE public.commission_rules
ADD COLUMN IF NOT EXISTS policy_type policy_type_enum,
ADD COLUMN IF NOT EXISTS vehicle_type_id UUID REFERENCES public.motor_vehicle_types(id);

-- Insert default line of business data
INSERT INTO public.line_of_business (name, description) VALUES
('Health', 'Health and medical insurance products'),
('Motor', 'Vehicle and motor insurance products'),
('Life', 'Life insurance and investment products'),
('Travel', 'Travel and vacation insurance products'),
('Loan', 'Loan protection and credit insurance'),
('Pet', 'Pet insurance and veterinary coverage'),
('Commercial', 'Commercial and business insurance products')
ON CONFLICT (name) DO NOTHING;

-- Insert default motor vehicle types
INSERT INTO public.motor_vehicle_types (name, description) VALUES
('Two-Wheeler', 'Motorcycles, scooters, and two-wheeled vehicles'),
('Private Car', 'Personal cars and private vehicles'),
('Commercial Vehicle', 'Trucks, buses, and commercial transportation'),
('Miscellaneous', 'Other motor vehicles not covered in standard categories')
ON CONFLICT (name) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_line_of_business_updated_at
  BEFORE UPDATE ON public.line_of_business
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_motor_vehicle_types_updated_at
  BEFORE UPDATE ON public.motor_vehicle_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();