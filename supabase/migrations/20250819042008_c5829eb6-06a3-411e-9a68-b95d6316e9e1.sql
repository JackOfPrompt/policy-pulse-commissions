-- Phase 1: Schema Normalization Migration
-- Create unified master tables and standardize existing structures

-- 1. Create status_master table for all status values
CREATE TABLE IF NOT EXISTS public.status_master (
  status_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status_code text NOT NULL,
  status_name text NOT NULL,
  category text NOT NULL, -- 'agent', 'policy', 'commission', 'document', etc.
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(status_code, category)
);

-- 2. Create channels table for all distribution channels
CREATE TABLE IF NOT EXISTS public.channels (
  channel_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_code text NOT NULL UNIQUE,
  channel_name text NOT NULL,
  channel_type text NOT NULL, -- 'direct', 'agent', 'broker', 'online', 'bancassurance'
  description text,
  commission_structure jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create unified product_catalog table
CREATE TABLE IF NOT EXISTS public.product_catalog (
  product_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code text NOT NULL,
  product_name text NOT NULL,
  lob_id uuid REFERENCES public.master_line_of_business(lob_id),
  provider_id uuid REFERENCES public.master_insurance_providers(provider_id),
  plan_type_id uuid REFERENCES public.master_plan_types(plan_type_id),
  policy_type_id uuid REFERENCES public.master_policy_types(id),
  product_category text,
  base_premium numeric(15,2),
  coverage_details jsonb,
  eligibility_criteria jsonb,
  features jsonb,
  exclusions jsonb,
  addon_compatibility uuid[], -- Array of addon_ids
  regulatory_info jsonb,
  is_active boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_code, version)
);

-- 4. Create unified policies table structure
CREATE TABLE IF NOT EXISTS public.policies_unified (
  policy_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_number text NOT NULL UNIQUE,
  tenant_id uuid NOT NULL,
  product_id uuid REFERENCES public.product_catalog(product_id),
  agent_id bigint REFERENCES public.agents(agent_id),
  branch_id bigint REFERENCES public.branches(branch_id),
  channel_id uuid REFERENCES public.channels(channel_id),
  customer_details jsonb NOT NULL,
  nominee_details jsonb,
  coverage_details jsonb NOT NULL,
  premium_details jsonb NOT NULL,
  policy_terms jsonb,
  lob_specific_data jsonb, -- LOB-specific fields stored as JSON
  status_id uuid REFERENCES public.status_master(status_id),
  issue_date date NOT NULL,
  commencement_date date NOT NULL,
  expiry_date date NOT NULL,
  renewal_due_date date,
  last_premium_paid_date date,
  next_premium_due_date date,
  sum_assured numeric(15,2),
  total_premium numeric(15,2) NOT NULL,
  paid_premium numeric(15,2) DEFAULT 0,
  outstanding_premium numeric(15,2) DEFAULT 0,
  commission_earned numeric(15,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- 5. Create policy_addons junction table
CREATE TABLE IF NOT EXISTS public.policy_addons (
  policy_addon_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id uuid NOT NULL REFERENCES public.policies_unified(policy_id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.master_addon(addon_id),
  sum_assured numeric(15,2),
  premium_amount numeric(15,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(policy_id, addon_id)
);

-- 6. Create unified commissions table
CREATE TABLE IF NOT EXISTS public.commissions_unified (
  commission_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  policy_id uuid REFERENCES public.policies_unified(policy_id),
  agent_id bigint REFERENCES public.agents(agent_id),
  commission_type text NOT NULL, -- 'first_year', 'renewal', 'trail', 'override'
  calculation_basis text NOT NULL, -- 'percentage', 'flat', 'tiered'
  base_amount numeric(15,2) NOT NULL,
  commission_rate numeric(5,4),
  commission_amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'INR',
  due_date date NOT NULL,
  payment_date date,
  status_id uuid REFERENCES public.status_master(status_id),
  payment_reference text,
  tax_details jsonb,
  override_details jsonb, -- For override commissions
  clawback_details jsonb,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Add standardized audit columns to existing tables
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS tenant_id_new uuid,
ADD COLUMN IF NOT EXISTS status_id uuid,
ADD COLUMN IF NOT EXISTS channel_id uuid,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS status_id uuid,
ADD COLUMN IF NOT EXISTS contact_details jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 8. Populate status_master with common statuses
INSERT INTO public.status_master (status_code, status_name, category, description, sort_order) VALUES
-- Agent statuses
('ACTIVE', 'Active', 'agent', 'Agent is active and can write policies', 1),
('INACTIVE', 'Inactive', 'agent', 'Agent is inactive', 2),
('PENDING', 'Pending', 'agent', 'Agent application pending approval', 3),
('SUSPENDED', 'Suspended', 'agent', 'Agent temporarily suspended', 4),
('TERMINATED', 'Terminated', 'agent', 'Agent contract terminated', 5),

-- Policy statuses
('ISSUED', 'Issued', 'policy', 'Policy has been issued', 1),
('INFORCE', 'In Force', 'policy', 'Policy is active and in force', 2),
('LAPSED', 'Lapsed', 'policy', 'Policy has lapsed due to non-payment', 3),
('SURRENDERED', 'Surrendered', 'policy', 'Policy has been surrendered', 4),
('MATURED', 'Matured', 'policy', 'Policy has matured', 5),
('CLAIMED', 'Claimed', 'policy', 'Claim has been made on policy', 6),
('CANCELLED', 'Cancelled', 'policy', 'Policy has been cancelled', 7),

-- Commission statuses
('CALCULATED', 'Calculated', 'commission', 'Commission calculated but not paid', 1),
('APPROVED', 'Approved', 'commission', 'Commission approved for payment', 2),
('PAID', 'Paid', 'commission', 'Commission has been paid', 3),
('CLAWED_BACK', 'Clawed Back', 'commission', 'Commission clawed back', 4),
('DISPUTED', 'Disputed', 'commission', 'Commission amount disputed', 5),

-- Document statuses
('UPLOADED', 'Uploaded', 'document', 'Document uploaded', 1),
('VERIFIED', 'Verified', 'document', 'Document verified', 2),
('REJECTED', 'Rejected', 'document', 'Document rejected', 3),
('EXPIRED', 'Expired', 'document', 'Document expired', 4)

ON CONFLICT (status_code, category) DO NOTHING;

-- 9. Populate channels with standard distribution channels
INSERT INTO public.channels (channel_code, channel_name, channel_type, description) VALUES
('DIRECT', 'Direct Sales', 'direct', 'Direct sales by company employees'),
('AGENT', 'Individual Agent', 'agent', 'Individual insurance agents'),
('BROKER', 'Insurance Broker', 'broker', 'Licensed insurance brokers'),
('ONLINE', 'Online Portal', 'online', 'Company website and online platforms'),
('BANCASSURANCE', 'Bank Partnership', 'bancassurance', 'Sales through bank partnerships'),
('CORPORATE', 'Corporate Agent', 'agent', 'Corporate agents and institutions'),
('TELEMARKETING', 'Telemarketing', 'direct', 'Phone-based sales'),
('REFERRAL', 'Referral Partner', 'agent', 'Referral partnerships')

ON CONFLICT (channel_code) DO NOTHING;

-- 10. Enable RLS on new tables
ALTER TABLE public.status_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions_unified ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for new tables
-- Status master - readable by all authenticated users
CREATE POLICY "status_master_read_policy" ON public.status_master
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "status_master_admin_policy" ON public.status_master
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'::app_role
  )
);

-- Channels - readable by all authenticated users
CREATE POLICY "channels_read_policy" ON public.channels
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "channels_admin_policy" ON public.channels
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'::app_role
  )
);

-- Product catalog - readable by all authenticated users
CREATE POLICY "product_catalog_read_policy" ON public.product_catalog
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_catalog_admin_policy" ON public.product_catalog
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'system_admin'::app_role
  )
);

-- Policies unified - tenant isolation
CREATE POLICY "policies_unified_tenant_policy" ON public.policies_unified
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (tenant_id = policies_unified.tenant_id OR role = 'system_admin'::app_role)
  )
);

-- Policy addons - tenant isolation through policy
CREATE POLICY "policy_addons_tenant_policy" ON public.policy_addons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.policies_unified p
    JOIN public.profiles pr ON (pr.tenant_id = p.tenant_id OR pr.role = 'system_admin'::app_role)
    WHERE p.policy_id = policy_addons.policy_id 
    AND pr.user_id = auth.uid()
  )
);

-- Commissions unified - tenant isolation
CREATE POLICY "commissions_unified_tenant_policy" ON public.commissions_unified
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (tenant_id = commissions_unified.tenant_id OR role = 'system_admin'::app_role)
  )
);

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_master_category ON public.status_master(category);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_product_catalog_lob ON public.product_catalog(lob_id);
CREATE INDEX IF NOT EXISTS idx_product_catalog_provider ON public.product_catalog(provider_id);
CREATE INDEX IF NOT EXISTS idx_policies_unified_tenant ON public.policies_unified(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_unified_agent ON public.policies_unified(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_unified_status ON public.policies_unified(status_id);
CREATE INDEX IF NOT EXISTS idx_policies_unified_expiry ON public.policies_unified(expiry_date);
CREATE INDEX IF NOT EXISTS idx_commissions_unified_tenant ON public.commissions_unified(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_unified_agent ON public.commissions_unified(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_unified_policy ON public.commissions_unified(policy_id);

-- 13. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_status_master_updated_at
    BEFORE UPDATE ON public.status_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_catalog_updated_at
    BEFORE UPDATE ON public.product_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_unified_updated_at
    BEFORE UPDATE ON public.policies_unified
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_unified_updated_at
    BEFORE UPDATE ON public.commissions_unified
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();