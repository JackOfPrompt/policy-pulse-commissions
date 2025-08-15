-- Create enum types for master_addon
CREATE TYPE public.addon_category_type AS ENUM ('Rider', 'Add-on');
CREATE TYPE public.premium_type AS ENUM ('Flat', 'PercentOfBase', 'AgeBand', 'Slab');
CREATE TYPE public.premium_basis AS ENUM ('PerPolicy', 'PerMember');

-- Create master_addon table
CREATE TABLE public.master_addon (
    addon_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    addon_code text UNIQUE NOT NULL,
    addon_name text NOT NULL,
    addon_category addon_category_type NOT NULL DEFAULT 'Add-on',
    description text,
    premium_type premium_type NOT NULL DEFAULT 'Flat',
    premium_basis premium_basis NOT NULL DEFAULT 'PerPolicy',
    calc_value numeric(10,2),
    min_amount numeric(12,2),
    max_amount numeric(12,2),
    waiting_period_months integer,
    is_mandatory boolean NOT NULL DEFAULT false,
    eligibility_json jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create addon_category_map table
CREATE TABLE public.addon_category_map (
    map_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    addon_id uuid NOT NULL REFERENCES public.master_addon(addon_id),
    category_id uuid REFERENCES public.master_product_category(category_id),
    subcategory_id uuid REFERENCES public.product_subcategory(subcategory_id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_addon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_category_map ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_addon
CREATE POLICY "Allow authenticated users to read addons" 
ON public.master_addon 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage addons" 
ON public.master_addon 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
));

-- Create RLS policies for addon_category_map
CREATE POLICY "Allow authenticated users to read addon category mappings" 
ON public.addon_category_map 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage addon category mappings" 
ON public.addon_category_map 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'
));

-- Add update trigger for master_addon
CREATE TRIGGER update_master_addon_updated_at
    BEFORE UPDATE ON public.master_addon
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for addon_category_map
CREATE TRIGGER update_addon_category_map_updated_at
    BEFORE UPDATE ON public.addon_category_map
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data
INSERT INTO public.master_addon (addon_code, addon_name, addon_category, description) VALUES
('CRIT_ILL', 'Critical Illness Rider', 'Rider', 'Coverage for critical illnesses'),
('PA_RIDER', 'Personal Accident Rider', 'Rider', 'Personal accident coverage'),
('HOSP_CASH', 'Hospital Cash', 'Add-on', 'Daily cash benefit during hospitalization'),
('RESTORE', 'Restore Benefit', 'Add-on', 'Restore sum insured benefit'),
('NCB_PROT', 'No Claim Bonus Protection', 'Add-on', 'Protection of no claim bonus'),
('MATERNITY', 'Maternity Benefit', 'Add-on', 'Maternity and newborn coverage'),
('AYUSH', 'AYUSH Treatment', 'Add-on', 'Alternative treatment coverage'),
('GLOBAL', 'Global Cover', 'Add-on', 'Worldwide coverage extension'),
('AMBULANCE', 'Ambulance Cover', 'Add-on', 'Emergency ambulance services'),
('ROOM_WAIVE', 'Waiver of Room Rent Limit', 'Add-on', 'Waiver of room rent restrictions'),
('OPD', 'OPD Cover', 'Add-on', 'Outpatient department coverage'),
('DH_CASH', 'Daily Hospital Cash', 'Add-on', 'Daily cash benefit for hospitalization'),
('SECOND_OP', 'Second Opinion Cover', 'Add-on', 'Medical second opinion coverage');