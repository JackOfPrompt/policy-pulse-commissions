-- ==========================================================
-- PLANS (Seeded with Free, Pro, Enterprise)
-- ==========================================================
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text unique not null, -- free, pro, enterprise
  description text,
  features jsonb default '{}'::jsonb,
  price_monthly numeric(10,2) default 0,
  price_yearly numeric(10,2) default 0,
  trial_period_days int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==========================================================
-- SUBSCRIPTIONS (per organization)
-- ==========================================================
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete restrict,
  
  status text not null check (status in ('trialing','active','expired','canceled')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  trial_end timestamptz,
  cancel_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint one_active_subscription_per_org
    unique (org_id)
);

-- Helpful indexes
create index if not exists idx_subscriptions_org_id on subscriptions(org_id);
create index if not exists idx_subscriptions_plan_id on subscriptions(plan_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

-- ==========================================================
-- RLS POLICIES
-- ==========================================================

-- Enable RLS on plans table
alter table plans enable row level security;

-- Plans are viewable by all authenticated users
create policy "Plans are viewable by all authenticated users"
on plans for select
to authenticated
using (true);

-- Only superadmins can manage plans
create policy "Super admins can manage plans"
on plans for all
to authenticated
using (is_superadmin())
with check (is_superadmin());

-- Enable RLS on subscriptions table
alter table subscriptions enable row level security;

-- Org admins can view/manage their org's subscription
create policy "Org admins can manage their org subscription"
on subscriptions for all
to authenticated
using (
  org_id in (
    select org_id from user_organizations 
    where user_id = auth.uid() and role in ('admin', 'superadmin')
  )
)
with check (
  org_id in (
    select org_id from user_organizations 
    where user_id = auth.uid() and role in ('admin', 'superadmin')
  )
);

-- Superadmins can manage all subscriptions
create policy "Super admins can manage all subscriptions"
on subscriptions for all
to authenticated
using (is_superadmin())
with check (is_superadmin());

-- ==========================================================
-- SEED INITIAL PLANS
-- ==========================================================
insert into plans (name, description, features, price_monthly, price_yearly, trial_period_days)
values
  ('free', 'Free plan with 2 months trial. Access to all CRM modules during trial.', 
   '{"modules": ["CRM"], "limits": "trial only"}', 0, 0, 60),
  ('pro', 'Pro plan with full CRM access.', 
   '{"modules": ["CRM"], "limits": "unlimited"}', 4999, 49999, 0),
  ('enterprise', 'Enterprise plan with CRM + Online Policy Purchasing.', 
   '{"modules": ["CRM","OnlinePolicyPurchase"], "limits": "unlimited"}', 9999, 99999, 0)
on conflict (name) do nothing;

-- ==========================================================
-- FUNCTION TO AUTO-ASSIGN FREE PLAN TO NEW ORGS
-- ==========================================================
create or replace function assign_free_plan_to_new_org()
returns trigger as $$
declare
  free_plan_id uuid;
begin
  -- Get the free plan id
  select id into free_plan_id from plans where name = 'free' limit 1;
  
  -- Create subscription with trial period
  if free_plan_id is not null then
    insert into subscriptions (org_id, plan_id, status, start_date, trial_end)
    values (
      new.id,
      free_plan_id,
      'trialing',
      now(),
      now() + interval '60 days'
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-assign free plan to new organizations
create trigger assign_free_plan_on_org_creation
  after insert on organizations
  for each row
  execute function assign_free_plan_to_new_org();