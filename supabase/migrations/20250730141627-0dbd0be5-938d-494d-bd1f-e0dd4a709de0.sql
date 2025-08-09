-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  default_dashboard TEXT DEFAULT '/admin/overview',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, module_name)
);

-- Add role_id to users_auth table
ALTER TABLE public.users_auth ADD COLUMN role_id UUID REFERENCES public.roles(id);
ALTER TABLE public.users_auth ADD COLUMN branch_id UUID REFERENCES public.branches(id);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for roles table
CREATE POLICY "Admin can view all roles" 
ON public.roles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE POLICY "Admin can insert roles" 
ON public.roles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE POLICY "Admin can update roles" 
ON public.roles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- Create policies for role_permissions table
CREATE POLICY "Admin can view all role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE POLICY "Admin can insert role permissions" 
ON public.role_permissions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

CREATE POLICY "Admin can update role permissions" 
ON public.role_permissions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- Insert default roles
INSERT INTO public.roles (name, slug, description, default_dashboard) VALUES
('Super Admin', 'super-admin', 'Full system access with all permissions', '/admin/overview'),
('Admin', 'admin', 'Administrative access to most system functions', '/admin/overview'),
('Finance Team', 'finance', 'Access to financial reports, payouts, and commissions', '/admin/payouts'),
('Accounts Team', 'accounts', 'Access to accounting and commission management', '/admin/commissions'),
('Business Head', 'business-head', 'High-level business overview and reporting access', '/admin/reports'),
('Sales Head', 'sales-head', 'Sales team oversight and performance monitoring', '/admin/agents'),
('Regional Manager', 'regional-manager', 'Regional oversight of branches and agents', '/admin/branches'),
('Branch Manager', 'branch-manager', 'Branch-level management of agents and policies', '/admin/agents'),
('Operations Team', 'operations', 'Operational management and policy processing', '/admin/policies'),
('Agent', 'agent', 'Limited access to own policies and commissions', '/admin/policies'),
('View-Only Analyst', 'analyst', 'Read-only access to reports and data', '/admin/reports');

-- Insert default permissions for Super Admin (full access)
INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, module, true, true, true, true, true
FROM public.roles r
CROSS JOIN (VALUES 
  ('dashboard'),
  ('policies'),
  ('agents'),
  ('employees'),
  ('branches'),
  ('providers'),
  ('products'),
  ('commissions'),
  ('payouts'),
  ('reports'),
  ('renewals'),
  ('tasks'),
  ('document-validation'),
  ('roles'),
  ('users')
) AS modules(module)
WHERE r.slug = 'super-admin';

-- Insert permissions for Admin (almost full access)
INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, module, true, 
  CASE WHEN module IN ('roles', 'users') THEN false ELSE true END,
  CASE WHEN module IN ('roles', 'users') THEN false ELSE true END,
  CASE WHEN module IN ('payouts', 'commissions') THEN false ELSE true END,
  true
FROM public.roles r
CROSS JOIN (VALUES 
  ('dashboard'),
  ('policies'),
  ('agents'),
  ('employees'),
  ('branches'),
  ('providers'),
  ('products'),
  ('commissions'),
  ('payouts'),
  ('reports'),
  ('renewals'),
  ('tasks'),
  ('document-validation')
) AS modules(module)
WHERE r.slug = 'admin';

-- Insert permissions for Finance Team
INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, module, true, 
  CASE WHEN module IN ('payouts', 'commissions') THEN true ELSE false END,
  CASE WHEN module IN ('payouts', 'commissions') THEN true ELSE false END,
  false,
  true
FROM public.roles r
CROSS JOIN (VALUES 
  ('dashboard'),
  ('payouts'),
  ('commissions'),
  ('reports'),
  ('agents'),
  ('policies')
) AS modules(module)
WHERE r.slug = 'finance';

-- Insert permissions for Branch Manager
INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, module, true, 
  CASE WHEN module IN ('agents', 'policies', 'tasks') THEN true ELSE false END,
  CASE WHEN module IN ('agents', 'policies', 'tasks') THEN true ELSE false END,
  false,
  true
FROM public.roles r
CROSS JOIN (VALUES 
  ('dashboard'),
  ('policies'),
  ('agents'),
  ('commissions'),
  ('reports'),
  ('renewals'),
  ('tasks')
) AS modules(module)
WHERE r.slug = 'branch-manager';

-- Insert permissions for Agent
INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, module, true, 
  CASE WHEN module = 'policies' THEN true ELSE false END,
  false,
  false,
  false
FROM public.roles r
CROSS JOIN (VALUES 
  ('dashboard'),
  ('policies'),
  ('commissions'),
  ('renewals')
) AS modules(module)
WHERE r.slug = 'agent';

-- Create updated_at trigger for roles
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for role_permissions
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();