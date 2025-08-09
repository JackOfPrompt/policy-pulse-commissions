-- Disable RLS on all policy-related tables to allow bulk uploads
ALTER TABLE public.policies_new DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_renewal_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_reconciliation DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on supporting tables that may be needed for policy operations
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit_trail DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_error_logs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on master data tables used during policy creation
ALTER TABLE public.insurance_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_of_business DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_vehicle_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;