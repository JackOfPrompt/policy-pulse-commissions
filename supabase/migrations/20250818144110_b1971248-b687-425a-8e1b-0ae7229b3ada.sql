-- Phase 1: Schema Consolidation - Simplified Safe Migration
-- Create new standardized tables and drop duplicates safely

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

-- Step 3: Create a unified organizations table (better version)
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

-- Step 4: Drop duplicate tables safely (only if they exist and are empty or not critical)
-- Drop employees table only if it exists (we'll keep tenant_employees as primary)
DROP TABLE IF EXISTS public.employees CASCADE;

-- Drop organization duplicates safely
DROP TABLE IF EXISTS public.orgs CASCADE;
DROP TABLE IF EXISTS public.tenant_organization CASCADE;
DROP TABLE IF EXISTS public.tenant_organizations CASCADE;

-- Drop finance duplicates safely  
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.journal_lines CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;

-- Step 5: Add audit fields to key tables that are missing them
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

-- Add audit fields to tenant_employees table 
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_employees' AND column_name = 'created_by') THEN
    ALTER TABLE public.tenant_employees ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_employees' AND column_name = 'updated_by') THEN
    ALTER TABLE public.tenant_employees ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- Add audit fields to commission_rules table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commission_rules' AND column_name = 'updated_by') THEN
    ALTER TABLE public.commission_rules ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- Step 6: Insert standard status values
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
  ('finance', 'Posted', 'POSTED', 4, '#059669'),
  ('employee', 'Active', 'ACTIVE', 1, '#10B981'),
  ('employee', 'Inactive', 'INACTIVE', 2, '#6B7280'),
  ('employee', 'On Leave', 'ON_LEAVE', 3, '#F59E0B'),
  ('employee', 'Terminated', 'TERMINATED', 4, '#EF4444')
ON CONFLICT (module, status_code) DO NOTHING;

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_status_master_module ON public.status_master(module);
CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON public.organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON public.organizations(parent_id);

-- Add indexes for tenant_id on key tables for performance
CREATE INDEX IF NOT EXISTS idx_agents_tenant ON public.agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_tenant ON public.branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_tenant ON public.policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_employees_tenant ON public.tenant_employees(tenant_id);

-- Step 8: Enable RLS on new tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for new tables
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