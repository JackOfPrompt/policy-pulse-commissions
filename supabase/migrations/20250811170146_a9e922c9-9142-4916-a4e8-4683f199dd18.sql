-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Utility: auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1) LOGIN ROLES TABLE (create first to satisfy FK dependencies)
create table if not exists public.login_roles (
  role_id uuid primary key default gen_random_uuid(),
  role_name varchar(50) unique not null,
  description text,
  permissions_json jsonb default '{}'::jsonb,
  default_landing_page varchar(255) default '/dashboard',
  is_tenant_level boolean default false,
  is_editable boolean default true,
  status varchar(20) check (status in ('Active','Inactive')) default 'Active',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.login_roles enable row level security;

create trigger trg_login_roles_updated_at
before update on public.login_roles
for each row execute function public.update_updated_at_column();

-- 2) PERMISSIONS TABLE
create table if not exists public.permissions (
  permission_id uuid primary key default gen_random_uuid(),
  module_name varchar(100) not null,
  action varchar(50) not null,
  description text,
  status varchar(20) check (status in ('Active','Inactive')) default 'Active',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid null -- optional link to public.users(user_id) without FK to avoid circular deps
);

create unique index if not exists idx_permissions_module_action
  on public.permissions(module_name, action);

alter table public.permissions enable row level security;

create trigger trg_permissions_updated_at
before update on public.permissions
for each row execute function public.update_updated_at_column();

-- 3) ROLE_PERMISSIONS TABLE
create table if not exists public.role_permissions (
  role_permission_id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.login_roles(role_id) on delete cascade,
  permission_id uuid not null references public.permissions(permission_id) on delete cascade,
  can_access boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint unique_role_permission unique (role_id, permission_id)
);

create index if not exists idx_role_permissions_role_id on public.role_permissions(role_id);
create index if not exists idx_role_permissions_permission_id on public.role_permissions(permission_id);

alter table public.role_permissions enable row level security;

create trigger trg_role_permissions_updated_at
before update on public.role_permissions
for each row execute function public.update_updated_at_column();

-- 4) USERS TABLE
create table if not exists public.users (
  user_id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  email varchar(100) unique not null,
  phone_number varchar(20),
  password_hash text not null,
  full_name varchar(100) not null,
  role_id uuid not null references public.login_roles(role_id) on delete restrict,
  is_email_verified boolean default false,
  is_phone_verified boolean default false,
  status varchar(20) check (status in ('Active','Inactive','Suspended','Deleted')) default 'Active',
  avatar_url text,
  last_login_at timestamp with time zone,
  failed_login_attempts integer default 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  updated_at timestamp with time zone not null default now(),
  metadata jsonb default '{}'::jsonb,
  preferred_channel varchar(20) check (preferred_channel in ('Email','SMS','WhatsApp','InApp')),
  terms_accepted_at timestamp with time zone
);

create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_users_role_id on public.users(role_id);
create index if not exists idx_users_email on public.users(email);

alter table public.users enable row level security;

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.update_updated_at_column();

-- Security helper functions (SECURITY DEFINER to avoid recursive RLS issues)
-- NOTE: Qualified schema names and empty search_path for safety
create or replace function public.current_user_role_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.role_id
  from public.users u
  where u.user_id = auth.uid();
$$;

create or replace function public.current_user_role_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lr.role_name
  from public.users u
  join public.login_roles lr on lr.role_id = u.role_id
  where u.user_id = auth.uid();
$$;

create or replace function public.current_user_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.tenant_id
  from public.users u
  where u.user_id = auth.uid();
$$;

create or replace function public.is_admin(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.users u
      join public.login_roles lr on lr.role_id = u.role_id
      where u.user_id = _user_id
        and lr.role_name in ('System Admin', 'System IT Support')
    ), false
  );
$$;

create or replace function public.has_permission(_module text, _action text, _user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.users u
      join public.role_permissions rp on rp.role_id = u.role_id and rp.can_access is true
      join public.permissions p on p.permission_id = rp.permission_id
      where u.user_id = _user_id
        and p.module_name = _module
        and p.action = _action
    ), false
  );
$$;

-- RLS POLICIES
-- login_roles
create policy if not exists "Roles are viewable by authenticated" on public.login_roles
for select to authenticated using (true);

create policy if not exists "Only admins can insert roles" on public.login_roles
for insert to authenticated with check (public.is_admin(auth.uid()));

create policy if not exists "Only admins can update roles" on public.login_roles
for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy if not exists "Only admins can delete roles" on public.login_roles
for delete to authenticated using (public.is_admin(auth.uid()));

-- permissions
create policy if not exists "Permissions are viewable by authenticated" on public.permissions
for select to authenticated using (true);

create policy if not exists "Only admins can insert permissions" on public.permissions
for insert to authenticated with check (public.is_admin(auth.uid()));

create policy if not exists "Only admins can update permissions" on public.permissions
for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy if not exists "Only admins can delete permissions" on public.permissions
for delete to authenticated using (public.is_admin(auth.uid()));

-- role_permissions
create policy if not exists "Role permissions are viewable by authenticated" on public.role_permissions
for select to authenticated using (true);

create policy if not exists "Only admins can insert role permissions" on public.role_permissions
for insert to authenticated with check (public.is_admin(auth.uid()));

create policy if not exists "Only admins can update role permissions" on public.role_permissions
for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy if not exists "Only admins can delete role permissions" on public.role_permissions
for delete to authenticated using (public.is_admin(auth.uid()));

-- users
create policy if not exists "Users can view allowed rows" on public.users
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or (tenant_id is not null and tenant_id = public.current_user_tenant_id())
);

create policy if not exists "Users can insert their own row" on public.users
for insert to authenticated
with check (
  user_id = auth.uid()
);

create policy if not exists "Users can update allowed rows" on public.users
for update to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or (tenant_id is not null and tenant_id = public.current_user_tenant_id())
)
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or (tenant_id is not null and tenant_id = public.current_user_tenant_id())
);

create policy if not exists "Only admins can delete users" on public.users
for delete to authenticated
using (public.is_admin(auth.uid()));

-- Seed default roles (idempotent)
insert into public.login_roles (role_name, description, default_landing_page, is_tenant_level)
select x.role_name, x.description, x.default_landing_page, x.is_tenant_level
from (
  values
    ('System Admin', 'Full access to all modules, system-wide', '/dashboard/system-admin', false),
    ('System IT Support', 'System-wide IT maintenance access', '/dashboard/it-support', false),
    ('Tenant Admin', 'Full access within a single tenant', '/dashboard/tenant-admin', true),
    ('Tenant Employee', 'Operational access within tenant', '/dashboard/employee', true),
    ('Tenant Agent', 'Sales and customer interaction role', '/dashboard/agent', true),
    ('Customer', 'End customer with self-service access', '/dashboard/customer', true)
) as x(role_name, description, default_landing_page, is_tenant_level)
where not exists (
  select 1 from public.login_roles lr where lr.role_name = x.role_name
);

-- Seed example permissions (idempotent)
insert into public.permissions (module_name, action, description)
select * from (values
  ('Policy Management', 'VIEW', 'Can view policies'),
  ('Policy Management', 'CREATE', 'Can create policies'),
  ('Policy Management', 'UPDATE', 'Can update policies'),
  ('Policy Management', 'DELETE', 'Can delete policies'),
  ('Policy Management', 'EXPORT', 'Can export policies'),
  ('Tenant Management', 'VIEW', 'Can view tenants'),
  ('Tenant Management', 'CREATE', 'Can create tenants')
) as v(module_name, action, description)
where not exists (
  select 1 from public.permissions p where p.module_name = v.module_name and p.action = v.action
);

-- Map: Give System Admin all permissions (idempotent)
insert into public.role_permissions (role_id, permission_id, can_access)
select r.role_id, p.permission_id, true
from public.login_roles r
cross join public.permissions p
where r.role_name = 'System Admin'
  and not exists (
    select 1 from public.role_permissions rp where rp.role_id = r.role_id and rp.permission_id = p.permission_id
  );

-- Optional: Basic read-only for IT Support (VIEW on all modules) (idempotent)
insert into public.role_permissions (role_id, permission_id, can_access)
select r.role_id, p.permission_id, true
from public.login_roles r
join public.permissions p on p.action = 'VIEW'
where r.role_name = 'System IT Support'
  and not exists (
    select 1 from public.role_permissions rp where rp.role_id = r.role_id and rp.permission_id = p.permission_id
  );
