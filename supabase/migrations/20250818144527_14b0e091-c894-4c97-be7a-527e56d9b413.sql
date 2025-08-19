-- Security Fix Migration: Enable RLS for Tables Only (Corrected)
-- Skip views and handle only actual tables

-- Enable RLS on tables that don't have it (excluding views)
ALTER TABLE public.allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_business_bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_renewal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_time_bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_employee_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for allocation_rules
CREATE POLICY "Tenant admins can manage allocation rules" ON public.allocation_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id::text = allocation_rules.tenant_id::text OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

-- Create RLS policies for audit_trail
CREATE POLICY "System admins can manage audit trail" ON public.audit_trail
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "Users can view their own audit trail" ON public.audit_trail
  FOR SELECT USING (
    audit_trail.actor_id = auth.uid()
  );

-- Create RLS policies for commission tables (linked via commission_rules)
CREATE POLICY "Tenant admins can manage commission business bonus" ON public.commission_business_bonus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.commission_rules cr ON cr.rule_id = commission_business_bonus.rule_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant users can view commission earnings" ON public.commission_earnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id::text = commission_earnings.tenant_id::text OR p.role = 'system_admin'::app_role)
    )
  );

CREATE POLICY "Tenant admins can manage commission earnings" ON public.commission_earnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id::text = commission_earnings.tenant_id::text OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant admins can manage commission overrides" ON public.commission_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = commission_overrides.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant admins can manage commission renewal" ON public.commission_renewal
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.commission_rules cr ON cr.rule_id = commission_renewal.rule_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant admins can manage commission tiers" ON public.commission_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.commission_rules cr ON cr.rule_id = commission_tiers.rule_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant admins can manage commission time bonus" ON public.commission_time_bonus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.commission_rules cr ON cr.rule_id = commission_time_bonus.rule_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = cr.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

-- Create RLS policies for system management tables
CREATE POLICY "System admins can manage permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "All authenticated users can view permissions" ON public.permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "All authenticated users can view roles" ON public.roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "All authenticated users can view role permissions" ON public.role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (
    user_roles.user_id = auth.uid()
  );

-- Create RLS policies for premium and product tables
CREATE POLICY "Tenant users can view premiums" ON public.premiums
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.policies pol ON pol.policy_id = premiums.policy_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = pol.tenant_id OR p.role = 'system_admin'::app_role)
    )
  );

CREATE POLICY "Tenant admins can manage premiums" ON public.premiums
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.policies pol ON pol.policy_id = premiums.policy_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = pol.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant admins can manage premium adjustments" ON public.premium_adjustments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.policies pol ON pol.policy_id = premium_adjustments.policy_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = pol.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "All authenticated users can view products" ON public.products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

-- Create RLS policies for revenue and settlement tables
CREATE POLICY "Tenant admins can manage revenue allocation" ON public.revenue_allocation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = revenue_allocation.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant admins can manage settlements" ON public.settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = settlements.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

CREATE POLICY "Tenant admins can manage settlement links" ON public.settlement_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.settlements s ON s.settlement_id = settlement_links.settlement_id
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = s.tenant_id OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

-- Create RLS policies for tenant-specific tables
CREATE POLICY "Tenant admins can manage their employee salaries" ON public.tenant_employee_salaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id::text = tenant_employee_salaries.tenant_id::text OR p.role = 'system_admin'::app_role)
      AND p.role = ANY (ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
    )
  );

-- Create RLS policies for tenants table
CREATE POLICY "System admins can manage all tenants" ON public.tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "Tenant admins can view their tenant" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = tenants.tenant_id OR p.role = 'system_admin'::app_role)
    )
  );

-- Create RLS policies for users table
CREATE POLICY "System admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (
    users.user_id = auth.uid()
  );

-- Create RLS policies for variances table if it has tenant_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'variances' AND column_name = 'tenant_id') THEN
    EXECUTE 'CREATE POLICY "Tenant admins can manage their variances" ON public.variances
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.user_id = auth.uid() 
          AND (p.tenant_id = variances.tenant_id OR p.role = ''system_admin''::app_role)
          AND p.role = ANY (ARRAY[''tenant_admin''::app_role, ''system_admin''::app_role])
        )
      )';
  ELSE
    EXECUTE 'CREATE POLICY "System admins can manage variances" ON public.variances
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.user_id = auth.uid() AND p.role = ''system_admin''::app_role
        )
      )';
  END IF;
END $$;

-- Create RLS policies for workflow tasks if it exists and has tenant_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_tasks') THEN
    EXECUTE 'CREATE POLICY "Tenant users can manage their workflow tasks" ON public.workflow_tasks
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.user_id = auth.uid() 
          AND (p.tenant_id = workflow_tasks.tenant_id OR p.role = ''system_admin''::app_role)
        )
      )';
  END IF;
END $$;