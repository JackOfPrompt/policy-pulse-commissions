-- Create MDM tables following existing convention and RLS helper
-- Note: Using mdm_* prefix to align with existing schema and mdm_apply_policies()

-- 1) Vehicle Types
create table if not exists public.mdm_vehicle_types (
  id uuid primary key default gen_random_uuid(),
  vehicle_type_id uuid,
  tenant_id uuid,
  vehicle_type_code text not null,
  vehicle_type_name text not null,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, vehicle_type_code)
);

-- 2) Vehicles
create table if not exists public.mdm_vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid,
  tenant_id uuid,
  code text not null,
  name text not null,
  make text,
  model text,
  variant text,
  year integer,
  fuel_type text,
  vehicle_type_id uuid not null references public.mdm_vehicle_types(id) on delete restrict,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- 3) Cities & Pincodes
create table if not exists public.mdm_cities (
  id uuid primary key default gen_random_uuid(),
  city_id uuid,
  tenant_id uuid,
  city_name text not null,
  pincode text not null,
  state_name text,
  country_code text,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, pincode, city_name)
);

-- 4) Relationship Codes
create table if not exists public.mdm_relationship_codes (
  id uuid primary key default gen_random_uuid(),
  relationship_code_id uuid,
  tenant_id uuid,
  code text not null,
  name text not null,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- 5) Health Conditions
create table if not exists public.mdm_health_conditions (
  id uuid primary key default gen_random_uuid(),
  health_condition_id uuid,
  tenant_id uuid,
  code text not null,
  name text not null,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- 6) Business Categories
create table if not exists public.mdm_business_categories (
  id uuid primary key default gen_random_uuid(),
  business_category_id uuid,
  tenant_id uuid,
  code text not null,
  name text not null,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- 7) Occupations
create table if not exists public.mdm_occupations (
  id uuid primary key default gen_random_uuid(),
  occupation_id uuid,
  tenant_id uuid,
  code text not null,
  name text not null,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- 8) Departments
create table if not exists public.mdm_departments (
  id uuid primary key default gen_random_uuid(),
  department_id uuid,
  tenant_id uuid,
  code text not null,
  name text not null,
  description text,
  status mdm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- Triggers for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_mdm_vehicle_types_updated
before update on public.mdm_vehicle_types
for each row execute function public.set_updated_at();

create trigger trg_mdm_vehicles_updated
before update on public.mdm_vehicles
for each row execute function public.set_updated_at();

create trigger trg_mdm_cities_updated
before update on public.mdm_cities
for each row execute function public.set_updated_at();

create trigger trg_mdm_relationship_codes_updated
before update on public.mdm_relationship_codes
for each row execute function public.set_updated_at();

create trigger trg_mdm_health_conditions_updated
before update on public.mdm_health_conditions
for each row execute function public.set_updated_at();

create trigger trg_mdm_business_categories_updated
before update on public.mdm_business_categories
for each row execute function public.set_updated_at();

create trigger trg_mdm_occupations_updated
before update on public.mdm_occupations
for each row execute function public.set_updated_at();

create trigger trg_mdm_departments_updated
before update on public.mdm_departments
for each row execute function public.set_updated_at();

-- Apply RLS policies using helper
select public.mdm_apply_policies('public.mdm_vehicle_types');
select public.mdm_apply_policies('public.mdm_vehicles');
select public.mdm_apply_policies('public.mdm_cities');
select public.mdm_apply_policies('public.mdm_relationship_codes');
select public.mdm_apply_policies('public.mdm_health_conditions');
select public.mdm_apply_policies('public.mdm_business_categories');
select public.mdm_apply_policies('public.mdm_occupations');
select public.mdm_apply_policies('public.mdm_departments');

-- Indexes for common queries
create index if not exists idx_mdm_cities_pincode on public.mdm_cities(pincode);
create index if not exists idx_mdm_cities_city_name on public.mdm_cities(city_name);
create index if not exists idx_mdm_vehicles_type on public.mdm_vehicles(vehicle_type_id);
