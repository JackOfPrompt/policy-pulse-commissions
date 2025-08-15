-- Create enum for status
CREATE TYPE location_status AS ENUM ('Active', 'Inactive');

-- Create Master_countries table
CREATE TABLE public.master_countries (
    country_code CHAR(3) PRIMARY KEY,
    country_name TEXT NOT NULL,
    status location_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Create Master_states table
CREATE TABLE public.master_states (
    state_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    state_code TEXT NOT NULL,
    state_name TEXT NOT NULL,
    country_code CHAR(3) NOT NULL REFERENCES public.master_countries(country_code),
    status location_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    UNIQUE(state_code, country_code)
);

-- Create Master_cities_new table (different from existing master_cities)
CREATE TABLE public.master_cities_new (
    city_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    city_code TEXT NOT NULL,
    city_name TEXT NOT NULL,
    state_id UUID NOT NULL REFERENCES public.master_states(state_id),
    country_code CHAR(3) NOT NULL REFERENCES public.master_countries(country_code),
    status location_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    UNIQUE(city_code, state_id)
);

-- Create Master_pincodes table
CREATE TABLE public.master_pincodes (
    pincode_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pincode TEXT NOT NULL,
    area_name TEXT,
    city_id UUID NOT NULL REFERENCES public.master_cities_new(city_id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status location_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    UNIQUE(pincode, city_id)
);

-- Enable Row Level Security
ALTER TABLE public.master_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_cities_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_pincodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users to read
CREATE POLICY "Allow authenticated users to read countries" 
ON public.master_countries FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to read states" 
ON public.master_states FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to read cities" 
ON public.master_cities_new FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to read pincodes" 
ON public.master_pincodes FOR SELECT 
USING (true);

-- Create RLS policies for system admins to manage all data
CREATE POLICY "System admins can manage countries" 
ON public.master_countries FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'system_admin'::app_role
));

CREATE POLICY "System admins can manage states" 
ON public.master_states FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'system_admin'::app_role
));

CREATE POLICY "System admins can manage cities" 
ON public.master_cities_new FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'system_admin'::app_role
));

CREATE POLICY "System admins can manage pincodes" 
ON public.master_pincodes FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'system_admin'::app_role
));

-- Create update triggers for updated_at timestamp
CREATE TRIGGER update_countries_updated_at
    BEFORE UPDATE ON public.master_countries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_states_updated_at
    BEFORE UPDATE ON public.master_states
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cities_new_updated_at
    BEFORE UPDATE ON public.master_cities_new
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pincodes_updated_at
    BEFORE UPDATE ON public.master_pincodes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.master_countries (country_code, country_name) VALUES 
('IND', 'India'),
('USA', 'United States'),
('CAN', 'Canada');

INSERT INTO public.master_states (state_code, state_name, country_code) VALUES 
('MH', 'Maharashtra', 'IND'),
('KA', 'Karnataka', 'IND'),
('DL', 'Delhi', 'IND'),
('CA', 'California', 'USA'),
('NY', 'New York', 'USA'),
('ON', 'Ontario', 'CAN');

-- Insert sample cities
INSERT INTO public.master_cities_new (city_code, city_name, state_id, country_code) 
SELECT 'MUM', 'Mumbai', state_id, 'IND' FROM public.master_states WHERE state_code = 'MH' AND country_code = 'IND';

INSERT INTO public.master_cities_new (city_code, city_name, state_id, country_code) 
SELECT 'PUN', 'Pune', state_id, 'IND' FROM public.master_states WHERE state_code = 'MH' AND country_code = 'IND';

INSERT INTO public.master_cities_new (city_code, city_name, state_id, country_code) 
SELECT 'BLR', 'Bangalore', state_id, 'IND' FROM public.master_states WHERE state_code = 'KA' AND country_code = 'IND';

-- Insert sample pincodes
INSERT INTO public.master_pincodes (pincode, area_name, city_id) 
SELECT '400001', 'Fort', city_id FROM public.master_cities_new WHERE city_code = 'MUM';

INSERT INTO public.master_pincodes (pincode, area_name, city_id) 
SELECT '400002', 'Churchgate', city_id FROM public.master_cities_new WHERE city_code = 'MUM';

INSERT INTO public.master_pincodes (pincode, area_name, city_id) 
SELECT '411001', 'Pune Central', city_id FROM public.master_cities_new WHERE city_code = 'PUN';