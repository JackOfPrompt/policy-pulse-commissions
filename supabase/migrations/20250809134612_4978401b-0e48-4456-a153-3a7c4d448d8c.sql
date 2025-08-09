-- Disable RLS for tenant, plan, and subscription management tables
ALTER TABLE IF EXISTS public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenant_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenant_gateway_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenant_add_on_pricing DISABLE ROW LEVEL SECURITY;