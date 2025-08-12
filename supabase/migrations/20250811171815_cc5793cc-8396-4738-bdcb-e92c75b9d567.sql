-- 1) Utility function to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Create enums safely
DO $$ BEGIN
  CREATE TYPE public.permission_status AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Tables
-- 3.1 login_roles
create table if not exists public.login_roles (
  role_id uuid primary key default gen_random_uuid(),
  role_name text not null unique,
  description text,
  default_landing_page text,
  is_tenant_level boolean default true,
  permissions_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 permissions
create table if not exists public.permissions (
  permission_id uuid primary key default gen_random_uuid(),
  module_name varchar(100) not null,
  action varchar(50) not null,
  description text,
  status public.permission_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references public.users(user_id) on delete set null,
  unique(module_name, action)
);

-- 3.3 users (profile linking to auth.users)
create table if not exists public.users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid null references public.login_roles(role_id) on delete set null,
  tenant_id uuid null,
  is_email_verified boolean default false,
  failed_login_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.4 role_permissions mapping
create table if not exists public.role_permissions (
  role_permission_id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.login_roles(role_id) on delete cascade,
  permission_id uuid not null references public.permissions(permission_id) on delete cascade,
  can_access boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(role_id, permission_id)
);

-- 4) Triggers for updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_login_roles_updated
  BEFORE UPDATE ON public.login_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_permissions_updated
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_role_permissions_updated
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) Helper functions (idempotent)
create or replace function public.current_user_role_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.role_id from public.users u where u.user_id = auth.uid();
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
  select u.tenant_id from public.users u where u.user_id = auth.uid();
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
      select 1 from public.users u
      join public.login_roles lr on lr.role_id = u.role_id
      where u.user_id = _user_id and lr.role_name in ('System Admin','System IT Support')
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
      where u.user_id = _user_id and p.module_name = _module and p.action = _action
    ), false
  );
$$;

-- 6) Enable RLS
alter table if exists public.login_roles enable row level security;
alter table if exists public.permissions enable row level security;
alter table if exists public.role_permissions enable row level security;
alter table if exists public.users enable row level security;

-- 7) Policies (drop & recreate idempotently)
-- login_roles
drop policy if exists "Roles are viewable by authenticated" on public.login_roles;
create policy "Roles are viewable by authenticated" on public.login_roles
for select to authenticated using (true);

drop policy if exists "Only admins can insert roles" on public.login_roles;
create policy "Only admins can insert roles" on public.login_roles
for insert to authenticated with check (public.is_admin(auth.uid()));

drop policy if exists "Only admins can update roles" on public.login_roles;
create policy "Only admins can update roles" on public.login_roles
for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Only admins can delete roles" on public.login_roles;
create policy "Only admins can delete roles" on public.login_roles
for delete to authenticated using (public.is_admin(auth.uid()));

-- permissions
drop policy if exists "Permissions are viewable by authenticated" on public.permissions;
create policy "Permissions are viewable by authenticated" on public.permissions
for select to authenticated using (true);

drop policy if exists "Only admins can insert permissions" on public.permissions;
create policy "Only admins can insert permissions" on public.permissions
for insert to authenticated with check (public.is_admin(auth.uid()));

drop policy if exists "Only admins can update permissions" on public.permissions;
create policy "Only admins can update permissions" on public.permissions
for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Only admins can delete permissions" on public.permissions;
create policy "Only admins can delete permissions" on public.permissions
for delete to authenticated using (public.is_admin(auth.uid()));

-- role_permissions
drop policy if exists "Role permissions are viewable by authenticated" on public.role_permissions;
create policy "Role permissions are viewable by authenticated" on public.role_permissions
for select to authenticated using (true);

drop policy if exists "Only admins can insert role permissions" on public.role_permissions;
create policy "Only admins can insert role permissions" on public.role_permissions
for insert to authenticated with check (public.is_admin(auth.uid()));

drop policy if exists "Only admins can update role permissions" on public.role_permissions;
create policy "Only admins can update role permissions" on public.role_permissions
for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Only admins can delete role permissions" on public.role_permissions;
create policy "Only admins can delete role permissions" on public.role_permissions
for delete to authenticated using (public.is_admin(auth.uid()));

-- users
drop policy if exists "Users can view allowed rows" on public.users;
create policy "Users can view allowed rows" on public.users
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or (tenant_id is not null and tenant_id = public.current_user_tenant_id())
);

drop policy if exists "Users can insert their own row" on public.users;
create policy "Users can insert their own row" on public.users
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update allowed rows" on public.users;
create policy "Users can update allowed rows" on public.users
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

drop policy if exists "Only admins can delete users" on public.users;
create policy "Only admins can delete users" on public.users
for delete to authenticated using (public.is_admin(auth.uid()));

-- 8) Seed default roles
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

-- 9) Seed permissions
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

-- 10) Map: System Admin gets all permissions
insert into public.role_permissions (role_id, permission_id, can_access)
select r.role_id, p.permission_id, true
from public.login_roles r
cross join public.permissions p
where r.role_name = 'System Admin'
  and not exists (
    select 1 from public.role_permissions rp where rp.role_id = r.role_id and rp.permission_id = p.permission_id
  );

-- 11) Map: IT Support gets VIEW permissions
insert into public.role_permissions (role_id, permission_id, can_access)
select r.role_id, p.permission_id, true
from public.login_roles r
join public.permissions p on p.action = 'VIEW'
where r.role_name = 'System IT Support'
  and not exists (
    select 1 from public.role_permissions rp where rp.role_id = r.role_id and rp.permission_id = p.permission_id
  );