-- Disable Row Level Security for policy tables to allow data insertion

-- Disable RLS on main policy tables
ALTER TABLE public.policies_new DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_policies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on policy-related tables
ALTER TABLE public.policy_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewal_logs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on related commission and transaction tables
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_reconciliation DISABLE ROW LEVEL SECURITY;

-- Disable RLS on customer table as it's related to policies
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;