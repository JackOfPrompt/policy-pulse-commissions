-- Phase 1: Schema Consolidation - Drop Duplicates and Merge Critical Tables (Fixed)
-- This migration consolidates duplicate tables and standardizes the schema

-- Step 1: Create unified documents table for centralized file management
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'policy', 'agent', 'claim', 'employee', etc.
  entity_id UUID NOT NULL,
  document_type VARCHAR(100) NOT NULL, -- 'application', 'kyc', 'claim_form', 'commission_statement'
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  tenant_id UUID NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) DEFAULT 'active'
);

-- Step 2: Create status master table for workflow management
CREATE TABLE IF NOT EXISTS public.status_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL, -- 'policy', 'agent', 'claim', 'commission', etc.
  status_name VARCHAR(100) NOT NULL,
  status_code VARCHAR(20) NOT NULL,
  workflow_order INTEGER DEFAULT 0,
  color VARCHAR(7), -- Hex color code
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(module, status_code)
);

-- Step 3: Merge employees tables - Migrate employees to tenant_employees
-- Fix the migration by mapping email to official_email
INSERT INTO public.tenant_employees (
  tenant_id, name, official_email, phone, status, created_at
)
SELECT 
  tenant_id::integer, 
  name, 
  email, 
  phone, 
  status::employee_status, 
  created_at
FROM public.employees
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_employees te 
  WHERE te.official_email = employees.email AND te.tenant_id = employees.tenant_id::integer
)
ON CONFLICT DO NOTHING;

-- Drop duplicate employees table
DROP TABLE IF EXISTS public.employees CASCADE;

-- Step 4: Consolidate organization tables
-- Create a unified organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  org_name VARCHAR(255) NOT NULL,
  org_code VARCHAR(50),
  org_type VARCHAR(50) DEFAULT 'branch', -- 'head_office', 'branch', 'sub_branch'
  parent_id UUID REFERENCES public.organizations(id),
  hierarchy_path TEXT, -- For efficient hierarchy queries
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  manager_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Check and migrate data from existing organization tables
DO $$
BEGIN
  -- Migrate from tenant_organizations if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_organizations') THEN
    INSERT INTO public.organizations (
      tenant_id, org_name, org_code, org_type, status, created_at, updated_at
    )
    SELECT 
      tenant_id,
      org_name,
      org_code,
      COALESCE(org_type, 'branch'),
      COALESCE(status, 'active'),
      COALESCE(created_at, now()),
      COALESCE(updated_at, now())
    FROM public.tenant_organizations
    ON CONFLICT DO NOTHING;
  END IF;

  -- Migrate from orgs if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orgs') THEN
    INSERT INTO public.organizations (
      tenant_id, org_name, org_type, status, created_at
    )
    SELECT 
      COALESCE(tenant_id, gen_random_uuid()),
      org_name,
      'branch',
      'active',
      now()
    FROM public.orgs
    WHERE org_name IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Drop redundant organization tables
DROP TABLE IF EXISTS public.orgs CASCADE;
DROP TABLE IF EXISTS public.tenant_organization CASCADE;
DROP TABLE IF EXISTS public.tenant_organizations CASCADE;

-- Step 5: Consolidate finance tables - Drop duplicates, keep finance_* versions
DO $$
BEGIN
  -- Migrate from accounts if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
    INSERT INTO public.finance_accounts (
      tenant_id, account_code, account_name, type, parent_account, is_active, created_at, updated_at
    )
    SELECT 
      tenant_id,
      account_code,
      account_name,
      type,
      parent_account,
      COALESCE(is_active, true),
      COALESCE(created_at, now()),
      COALESCE(updated_at, now())
    FROM public.accounts
    WHERE NOT EXISTS (
      SELECT 1 FROM public.finance_accounts fa 
      WHERE fa.account_code = accounts.account_code AND fa.tenant_id = accounts.tenant_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Migrate journal data if journals table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journals') THEN
    INSERT INTO public.finance_journals (
      tenant_id, journal_type, reference_id, trace_id, description, status, created_by, created_at, posted_at
    )
    SELECT 
      tenant_id,
      journal_type,
      reference_id,
      trace_id,
      description,
      COALESCE(status, 'Draft'),
      created_by,
      COALESCE(created_at, now()),
      posted_at
    FROM public.journals
    WHERE NOT EXISTS (
      SELECT 1 FROM public.finance_journals fj 
      WHERE fj.reference_id = journals.reference_id AND fj.tenant_id = journals.tenant_id
    )
    ON CONFLICT DO NOTHING;

    -- Migrate journal lines data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_lines') THEN
      INSERT INTO public.finance_journal_lines (
        journal_id, account_id, debit, credit, currency, fx_rate, created_at
      )
      SELECT 
        fj.journal_id,
        jl.account_id,
        COALESCE(jl.debit, 0),
        COALESCE(jl.credit, 0),
        COALESCE(jl.currency, 'INR'),
        COALESCE(jl.fx_rate, 1.0),
        COALESCE(jl.created_at, now())
      FROM public.journal_lines jl
      JOIN public.journals j ON j.journal_id = jl.journal_id
      JOIN public.finance_journals fj ON fj.reference_id = j.reference_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.finance_journal_lines fjl 
        WHERE fjl.journal_id = fj.journal_id AND fjl.account_id = jl.account_id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Migrate payout data if payouts table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts') THEN
    INSERT INTO public.finance_payouts (
      tenant_id, org_id, agent_name, amount, status, request_date, created_at, updated_at
    )
    SELECT 
      COALESCE(tenant_id, gen_random_uuid()),
      org_id,
      agent_name,
      amount,
      COALESCE(status, 'Requested'),
      COALESCE(request_date, CURRENT_DATE),
      COALESCE(created_at, now()),
      COALESCE(updated_at, now())
    FROM public.payouts
    WHERE NOT EXISTS (
      SELECT 1 FROM public.finance_payouts fp 
      WHERE fp.agent_name = payouts.agent_name AND fp.amount = payouts.amount
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Drop duplicate finance tables
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.journal_lines CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;

-- Step 6: Add audit fields to key tables that are missing them
-- Add audit fields to agents table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'created_by') THEN
    ALTER TABLE public.agents ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'updated_by') THEN
    ALTER TABLE public.agents ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- Add audit fields to branches table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'created_by') THEN
    ALTER TABLE public.branches ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'updated_by') THEN
    ALTER TABLE public.branches ADD COLUMN updated_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'updated_at') THEN
    ALTER TABLE public.branches ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Add audit fields to policies table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'created_by') THEN
    ALTER TABLE public.policies ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'updated_by') THEN
    ALTER TABLE public.policies ADD COLUMN updated_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'updated_at') THEN
    ALTER TABLE public.policies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Step 7: Insert standard status values
INSERT INTO public.status_master (module, status_name, status_code, workflow_order, color) VALUES
  ('policy', 'Draft', 'DRAFT', 1, '#FEF3C7'),
  ('policy', 'Pending Approval', 'PENDING_APPROVAL', 2, '#FDE68A'),
  ('policy', 'Active', 'ACTIVE', 3, '#10B981'),
  ('policy', 'Expired', 'EXPIRED', 4, '#EF4444'),
  ('policy', 'Cancelled', 'CANCELLED', 5, '#6B7280'),
  ('agent', 'Pending', 'PENDING', 1, '#FEF3C7'),
  ('agent', 'Active', 'ACTIVE', 2, '#10B981'),
  ('agent', 'Suspended', 'SUSPENDED', 3, '#F59E0B'),
  ('agent', 'Terminated', 'TERMINATED', 4, '#EF4444'),
  ('commission', 'Pending', 'PENDING', 1, '#FEF3C7'),
  ('commission', 'Approved', 'APPROVED', 2, '#10B981'),
  ('commission', 'Paid', 'PAID', 3, '#059669'),
  ('commission', 'Rejected', 'REJECTED', 4, '#EF4444'),
  ('claim', 'Registered', 'REGISTERED', 1, '#FEF3C7'),
  ('claim', 'Under Investigation', 'INVESTIGATING', 2, '#F59E0B'),
  ('claim', 'Approved', 'APPROVED', 3, '#10B981'),
  ('claim', 'Settled', 'SETTLED', 4, '#059669'),
  ('claim', 'Rejected', 'REJECTED', 5, '#EF4444'),
  ('finance', 'Draft', 'DRAFT', 1, '#FEF3C7'),
  ('finance', 'Pending', 'PENDING', 2, '#F59E0B'),
  ('finance', 'Approved', 'APPROVED', 3, '#10B981'),
  ('finance', 'Posted', 'POSTED', 4, '#059669')
ON CONFLICT (module, status_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_status_master_module ON public.status_master(module);
CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON public.organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON public.organizations(parent_id);

-- Enable RLS on new tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Tenant users can manage their documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = documents.tenant_id OR p.role = 'system_admin'::app_role)
    )
  );

CREATE POLICY "All authenticated users can view status master" ON public.status_master
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage status master" ON public.status_master
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'system_admin'::app_role
    )
  );

CREATE POLICY "Tenant users can manage their organizations" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND (p.tenant_id = organizations.tenant_id OR p.role = 'system_admin'::app_role)
    )
  );