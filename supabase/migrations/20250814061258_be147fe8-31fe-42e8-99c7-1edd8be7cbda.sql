-- Create enum types for insurance providers
CREATE TYPE provider_status AS ENUM ('Active', 'Inactive', 'Pending');
CREATE TYPE provider_type AS ENUM ('Life', 'General', 'Health', 'Composite');

-- Create master_cities table (referenced by master_insurance_providers)
CREATE TABLE public.master_cities (
    city_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    state_name VARCHAR(100),
    country_code VARCHAR(5) DEFAULT 'IND',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create master_insurance_providers table
CREATE TABLE public.master_insurance_providers (
    provider_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code VARCHAR(20) UNIQUE NOT NULL, -- short code like ICICI-GRP
    provider_name VARCHAR(150) NOT NULL,       -- full registered name
    trade_name VARCHAR(100),                   -- commercial brand name
    provider_type provider_type,               -- using custom enum type
    parent_provider_id UUID NULL REFERENCES master_insurance_providers(provider_id)
        ON UPDATE CASCADE ON DELETE SET NULL,  -- group relationships
    irda_license_number VARCHAR(50) NOT NULL,
    irda_license_valid_till DATE NOT NULL,
    logo_file_path TEXT,                       -- path or key in storage bucket
    contact_person VARCHAR(100),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(20),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city_id UUID REFERENCES master_cities(city_id),
    state VARCHAR(100),
    country_code VARCHAR(5) DEFAULT 'IND',
    website_url TEXT,
    status provider_status DEFAULT 'Active',   -- using custom enum type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.master_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_insurance_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_cities
CREATE POLICY "Allow authenticated users to read cities"
ON public.master_cities
FOR SELECT
USING (true);

CREATE POLICY "System admins can manage cities"
ON public.master_cities
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'system_admin'
));

-- Create RLS policies for master_insurance_providers
CREATE POLICY "Allow authenticated users to read insurance providers"
ON public.master_insurance_providers
FOR SELECT
USING (true);

CREATE POLICY "System admins can manage insurance providers"
ON public.master_insurance_providers
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'system_admin'
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON public.master_cities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON public.master_insurance_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();