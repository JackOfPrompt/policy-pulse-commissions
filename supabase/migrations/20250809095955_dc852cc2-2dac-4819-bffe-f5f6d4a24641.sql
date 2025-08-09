-- Create missing master data tables to fix fetch errors on /admin/master-data
-- Includes minimal schemas aligned with UI fields, timestamps, is_active, and RLS policies

-- Helper: create enum for status where relevant (text is fine but keep checks simple)

-- 1) UIN/IRDAI Codes
CREATE TABLE IF NOT EXISTS public.master_uin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uin_code text UNIQUE NOT NULL,
  product_name text NOT NULL,
  insurer_name text NOT NULL,
  line_of_business text NOT NULL,
  product_type text,
  effective_date date,
  expiry_date date,
  filing_date date,
  approval_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','withdrawn')),
  source_file_name text,
  version bigint,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  created_by uuid,
  last_updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.master_uin_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_uin_codes' AND policyname='Public read uin codes'
  ) THEN
    CREATE POLICY "Public read uin codes" ON public.master_uin_codes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_uin_codes' AND policyname='Write uin codes (authenticated)'
  ) THEN
    CREATE POLICY "Write uin codes (authenticated)" ON public.master_uin_codes FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update uin codes (authenticated)" ON public.master_uin_codes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_master_uin_codes_updated_at ON public.master_uin_codes;
CREATE TRIGGER trg_master_uin_codes_updated_at
BEFORE UPDATE ON public.master_uin_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Cities & Pincodes
CREATE TABLE IF NOT EXISTS public.master_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  state_name text NOT NULL,
  pincode text NOT NULL,
  district text,
  region text,
  tier text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_master_cities_pincode ON public.master_cities(pincode);
ALTER TABLE public.master_cities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_cities' AND policyname='Public read cities') THEN
    CREATE POLICY "Public read cities" ON public.master_cities FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_cities' AND policyname='Write cities (authenticated)') THEN
    CREATE POLICY "Write cities (authenticated)" ON public.master_cities FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update cities (authenticated)" ON public.master_cities FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_cities_updated_at ON public.master_cities;
CREATE TRIGGER trg_master_cities_updated_at
BEFORE UPDATE ON public.master_cities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Add-ons & Riders
CREATE TABLE IF NOT EXISTS public.master_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_name text NOT NULL,
  addon_code text,
  line_of_business text NOT NULL,
  addon_type text,
  description text,
  base_premium numeric,
  premium_percentage numeric,
  sum_insured_limit numeric,
  applicable_age_min integer,
  applicable_age_max integer,
  is_mandatory boolean DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_addons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_addons' AND policyname='Public read addons') THEN
    CREATE POLICY "Public read addons" ON public.master_addons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_addons' AND policyname='Write addons (authenticated)') THEN
    CREATE POLICY "Write addons (authenticated)" ON public.master_addons FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update addons (authenticated)" ON public.master_addons FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_addons_updated_at ON public.master_addons;
CREATE TRIGGER trg_master_addons_updated_at
BEFORE UPDATE ON public.master_addons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Health Conditions
CREATE TABLE IF NOT EXISTS public.master_health_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_name text NOT NULL,
  condition_code text,
  category text,
  waiting_period_months integer,
  exclusion_period_months integer,
  coverage_percentage numeric,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_health_conditions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_health_conditions' AND policyname='Public read health conditions') THEN
    CREATE POLICY "Public read health conditions" ON public.master_health_conditions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_health_conditions' AND policyname='Write health conditions (authenticated)') THEN
    CREATE POLICY "Write health conditions (authenticated)" ON public.master_health_conditions FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update health conditions (authenticated)" ON public.master_health_conditions FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_health_conditions_updated_at ON public.master_health_conditions;
CREATE TRIGGER trg_master_health_conditions_updated_at
BEFORE UPDATE ON public.master_health_conditions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Benefits
CREATE TABLE IF NOT EXISTS public.master_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_name text NOT NULL,
  benefit_code text,
  line_of_business text NOT NULL,
  benefit_type text,
  benefit_amount numeric,
  benefit_percentage numeric,
  coverage_limit numeric,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_benefits ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_benefits' AND policyname='Public read benefits') THEN
    CREATE POLICY "Public read benefits" ON public.master_benefits FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_benefits' AND policyname='Write benefits (authenticated)') THEN
    CREATE POLICY "Write benefits (authenticated)" ON public.master_benefits FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update benefits (authenticated)" ON public.master_benefits FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_benefits_updated_at ON public.master_benefits;
CREATE TRIGGER trg_master_benefits_updated_at
BEFORE UPDATE ON public.master_benefits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Premium Bands
CREATE TABLE IF NOT EXISTS public.master_premium_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_name text NOT NULL,
  line_of_business text NOT NULL,
  product_type text,
  age_group_start integer,
  age_group_end integer,
  sum_insured_start numeric,
  sum_insured_end numeric,
  base_premium numeric,
  premium_rate numeric,
  gender text,
  zone text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_premium_bands ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_premium_bands' AND policyname='Public read premium bands') THEN
    CREATE POLICY "Public read premium bands" ON public.master_premium_bands FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_premium_bands' AND policyname='Write premium bands (authenticated)') THEN
    CREATE POLICY "Write premium bands (authenticated)" ON public.master_premium_bands FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update premium bands (authenticated)" ON public.master_premium_bands FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_premium_bands_updated_at ON public.master_premium_bands;
CREATE TRIGGER trg_master_premium_bands_updated_at
BEFORE UPDATE ON public.master_premium_bands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Business Categories
CREATE TABLE IF NOT EXISTS public.master_business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  category_code text,
  industry_type text,
  risk_category text,
  hazard_class text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_business_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_business_categories' AND policyname='Public read business categories') THEN
    CREATE POLICY "Public read business categories" ON public.master_business_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_business_categories' AND policyname='Write business categories (authenticated)') THEN
    CREATE POLICY "Write business categories (authenticated)" ON public.master_business_categories FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update business categories (authenticated)" ON public.master_business_categories FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_business_categories_updated_at ON public.master_business_categories;
CREATE TRIGGER trg_master_business_categories_updated_at
BEFORE UPDATE ON public.master_business_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) Relationship Types
CREATE TABLE IF NOT EXISTS public.master_relationship_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_name text NOT NULL,
  relationship_code text,
  applicable_for text[],
  is_blood_relation boolean DEFAULT false,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_relationship_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_relationship_types' AND policyname='Public read relationship types') THEN
    CREATE POLICY "Public read relationship types" ON public.master_relationship_types FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_relationship_types' AND policyname='Write relationship types (authenticated)') THEN
    CREATE POLICY "Write relationship types (authenticated)" ON public.master_relationship_types FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update relationship types (authenticated)" ON public.master_relationship_types FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_relationship_types_updated_at ON public.master_relationship_types;
CREATE TRIGGER trg_master_relationship_types_updated_at
BEFORE UPDATE ON public.master_relationship_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) Occupations
CREATE TABLE IF NOT EXISTS public.master_occupations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_name text NOT NULL,
  occupation_code text,
  occupation_category text,
  risk_class text,
  loading_percentage numeric,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_occupations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_occupations' AND policyname='Public read occupations') THEN
    CREATE POLICY "Public read occupations" ON public.master_occupations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_occupations' AND policyname='Write occupations (authenticated)') THEN
    CREATE POLICY "Write occupations (authenticated)" ON public.master_occupations FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update occupations (authenticated)" ON public.master_occupations FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_occupations_updated_at ON public.master_occupations;
CREATE TRIGGER trg_master_occupations_updated_at
BEFORE UPDATE ON public.master_occupations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10) Vehicle Data (minimal schema per UI fields)
CREATE TABLE IF NOT EXISTS public.master_vehicle_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid,
  vehicle_type text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  variant text,
  fuel_type text,
  vehicle_category text,
  cubic_capacity integer,
  seating_capacity integer,
  manufacturing_year_start integer,
  manufacturing_year_end integer,
  body_type text,
  transmission_type text,
  ex_showroom_price numeric,
  max_gvw integer,
  max_payload integer,
  wheelbase integer,
  ground_clearance integer,
  safety_rating text,
  airbags_count integer,
  abs_available boolean,
  ebd_available boolean,
  esp_available boolean,
  isofix_available boolean,
  reverse_camera boolean,
  reverse_sensors boolean,
  tpms_available boolean,
  engine_capacity_litres numeric,
  max_power_bhp numeric,
  max_torque_nm numeric,
  mileage_kmpl numeric,
  fuel_tank_capacity numeric,
  boot_space_litres numeric,
  turning_radius numeric,
  ncap_rating text,
  registration_type text,
  rto_applicable text,
  depreciation_rate numeric,
  idv_percentage numeric,
  zone_classification text,
  provider_vehicle_code text,
  api_mapping_key text,
  is_commercial_use boolean,
  special_attributes text,
  remarks text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_updated_by uuid,
  source_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.master_vehicle_data ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_vehicle_data' AND policyname='Public read vehicle data') THEN
    CREATE POLICY "Public read vehicle data" ON public.master_vehicle_data FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='master_vehicle_data' AND policyname='Write vehicle data (authenticated)') THEN
    CREATE POLICY "Write vehicle data (authenticated)" ON public.master_vehicle_data FOR INSERT WITH CHECK (true);
    CREATE POLICY "Update vehicle data (authenticated)" ON public.master_vehicle_data FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_master_vehicle_data_updated_at ON public.master_vehicle_data;
CREATE TRIGGER trg_master_vehicle_data_updated_at
BEFORE UPDATE ON public.master_vehicle_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
