-- Fix previous error: recreate policies safely, add triggers idempotently

-- helper function exists (recreate safe)
create or replace function public.is_tenant_admin(_user_id uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
    from public.users u
    join public.login_roles lr on lr.role_id = u.role_id
    where u.user_id = _user_id and lr.role_name = 'Tenant Admin'
  ), false);
$$;

-- Tables (idempotent creates)
create table if not exists public.tenants (
  tenant_id uuid primary key default gen_random_uuid(),
  tenant_code varchar(20) unique not null,
  tenant_name varchar(100) not null,
  contact_person varchar(100),
  contact_email varchar(150) not null,
  phone_number varchar(30),
  industry_type varchar(50),
  logo_url text,
  status varchar(20) not null default 'Pending',
  timezone varchar(50) default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text,
  constraint tenants_status_check check (status in ('Active','Inactive','Pending'))
);

create index if not exists idx_tenants_code on public.tenants(tenant_code);
create index if not exists idx_tenants_status on public.tenants(status);

create table if not exists public.subscription_plans (
  plan_id uuid primary key default gen_random_uuid(),
  plan_name varchar(100) not null,
  plan_code varchar(30) unique not null,
  description text,
  monthly_price numeric(10,2) not null default 0.00,
  annual_price numeric(10,2),
  currency_code varchar(10) default 'INR',
  regional_prices jsonb,
  trial_days int default 0,
  includes_trial boolean default false,
  max_users int,
  max_agents int,
  max_products int,
  api_access boolean default false,
  reporting_tools boolean default false,
  support_level varchar(20) not null default 'Basic',
  features jsonb,
  available_add_ons jsonb,
  is_active boolean default true,
  is_default_plan boolean default false,
  created_by uuid references public.users(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_support_level_check check (support_level in ('Basic','Priority','Dedicated'))
);

create index if not exists idx_subscription_plans_code on public.subscription_plans(plan_code);
create index if not exists idx_subscription_plans_active on public.subscription_plans(is_active);

create table if not exists public.tenant_subscriptions (
  subscription_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(tenant_id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(plan_id),
  plan_snapshot jsonb,
  start_date date not null,
  end_date date not null,
  billing_cycle varchar(20) not null,
  payment_status varchar(20) not null,
  last_payment_date date,
  next_renewal_date date,
  auto_renew boolean default true,
  trial_used boolean default false,
  trial_start_date date,
  trial_end_date date,
  current_add_ons jsonb,
  discount_code varchar(50),
  payment_method varchar(50),
  invoice_reference varchar(100),
  is_active boolean default true,
  cancelled_on date,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(user_id),
  updated_at timestamptz not null default now(),
  constraint tenant_subscriptions_billing_cycle_check check (billing_cycle in ('Monthly','Yearly')),
  constraint tenant_subscriptions_payment_status_check check (payment_status in ('Paid','Pending','Overdue','Failed')),
  constraint tenant_subscriptions_dates_check check (end_date >= start_date)
);

create index if not exists idx_tenant_subscriptions_tenant on public.tenant_subscriptions(tenant_id);
create index if not exists idx_tenant_subscriptions_dates on public.tenant_subscriptions(end_date, next_renewal_date);
create index if not exists idx_tenant_subscriptions_active on public.tenant_subscriptions(is_active);

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.tenant_subscriptions enable row level security;

-- Drop existing policies to allow re-run
drop policy if exists "Tenants are viewable by admin or matching tenant" on public.tenants;
drop policy if exists "Only admins can insert tenants" on public.tenants;
drop policy if exists "Admins or tenant admins can update their tenant" on public.tenants;
drop policy if exists "Only admins can delete tenants" on public.tenants;

create policy "Tenants are viewable by admin or matching tenant" on public.tenants
for select to authenticated using (
  is_admin(auth.uid()) OR exists (
    select 1 from public.users u where u.user_id = auth.uid() and u.tenant_id = tenants.tenant_id
  )
);

create policy "Only admins can insert tenants" on public.tenants
for insert to authenticated with check (is_admin(auth.uid()));

create policy "Admins or tenant admins can update their tenant" on public.tenants
for update to authenticated using (
  is_admin(auth.uid()) OR (
    public.is_tenant_admin(auth.uid()) AND exists (
      select 1 from public.users u where u.user_id = auth.uid() and u.tenant_id = tenants.tenant_id
    )
  )
) with check (
  is_admin(auth.uid()) OR (
    public.is_tenant_admin(auth.uid()) AND exists (
      select 1 from public.users u where u.user_id = auth.uid() and u.tenant_id = tenants.tenant_id
    )
  )
);

create policy "Only admins can delete tenants" on public.tenants
for delete to authenticated using (is_admin(auth.uid()));

-- Plans policies
drop policy if exists "Plans are viewable by authenticated" on public.subscription_plans;
drop policy if exists "Only admins can insert plans" on public.subscription_plans;
drop policy if exists "Only admins can update plans" on public.subscription_plans;
drop policy if exists "Only admins can delete plans" on public.subscription_plans;

create policy "Plans are viewable by authenticated" on public.subscription_plans
for select to authenticated using (true);

create policy "Only admins can insert plans" on public.subscription_plans
for insert to authenticated with check (is_admin(auth.uid()));

create policy "Only admins can update plans" on public.subscription_plans
for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "Only admins can delete plans" on public.subscription_plans
for delete to authenticated using (is_admin(auth.uid()));

-- Tenant subscriptions policies
drop policy if exists "Subscriptions viewable by admin or tenant admin of same tenant" on public.tenant_subscriptions;
drop policy if exists "Subscriptions insert by admin or tenant admin for own tenant" on public.tenant_subscriptions;
drop policy if exists "Subscriptions update by admin or tenant admin for own tenant" on public.tenant_subscriptions;
drop policy if exists "Subscriptions delete by admin or tenant admin for own tenant" on public.tenant_subscriptions;

create policy "Subscriptions viewable by admin or tenant admin of same tenant" on public.tenant_subscriptions
for select to authenticated using (
  is_admin(auth.uid()) OR (
    public.is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()
  )
);

create policy "Subscriptions insert by admin or tenant admin for own tenant" on public.tenant_subscriptions
for insert to authenticated with check (
  is_admin(auth.uid()) OR (
    public.is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()
  )
);

create policy "Subscriptions update by admin or tenant admin for own tenant" on public.tenant_subscriptions
for update to authenticated using (
  is_admin(auth.uid()) OR (
    public.is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()
  )
) with check (
  is_admin(auth.uid()) OR (
    public.is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()
  )
);

create policy "Subscriptions delete by admin or tenant admin for own tenant" on public.tenant_subscriptions
for delete to authenticated using (
  is_admin(auth.uid()) OR (
    public.is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()
  )
);

-- Triggers (drop if exists first)
drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at before update on public.tenants for each row execute function public.set_updated_at();

drop trigger if exists set_subscription_plans_updated_at on public.subscription_plans;
create trigger set_subscription_plans_updated_at before update on public.subscription_plans for each row execute function public.set_updated_at();

drop trigger if exists set_tenant_subscriptions_updated_at on public.tenant_subscriptions;
create trigger set_tenant_subscriptions_updated_at before update on public.tenant_subscriptions for each row execute function public.set_updated_at();