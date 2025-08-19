-- ============================================================================
-- INSURANCE PLATFORM SCHEMA OPTIMIZATION MIGRATION
-- Phase 1: Create New Optimized Schema Structure
-- ============================================================================

-- Create new consolidated master tables
CREATE TABLE IF NOT EXISTS master_reference_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'location', 'department', 'occupation', etc.
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES master_reference_data(id),
    metadata JSONB DEFAULT '{}',
    hierarchy_level INTEGER DEFAULT 1,
    tenant_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category, code, tenant_id)
);

-- Create indexes for performance
CREATE INDEX idx_master_reference_category ON master_reference_data(category);
CREATE INDEX idx_master_reference_tenant ON master_reference_data(tenant_id);
CREATE INDEX idx_master_reference_parent ON master_reference_data(parent_id);

-- Unified products table
CREATE TABLE IF NOT EXISTS products_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL,
    lob_id UUID NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    plan_type VARCHAR(100),
    product_config JSONB DEFAULT '{}', -- Consolidates all product-specific configs
    pricing_config JSONB DEFAULT '{}', -- Premium structures, frequencies, etc.
    eligibility_config JSONB DEFAULT '{}', -- Age limits, conditions, etc.
    coverage_config JSONB DEFAULT '{}', -- Sum insured, deductibles, etc.
    tenant_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Unified policy details table (consolidates all LOB-specific tables)
CREATE TABLE IF NOT EXISTS policy_details_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    lob_type VARCHAR(50) NOT NULL, -- 'motor', 'health', 'life', etc.
    
    -- Common fields
    sum_insured DECIMAL(15,2),
    premium_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- LOB-specific details stored as JSONB
    motor_details JSONB, -- vehicle info, coverage, etc.
    health_details JSONB, -- medical history, family details, etc.
    life_details JSONB, -- nominee info, maturity details, etc.
    
    -- Policy participants
    proposer_details JSONB,
    insured_details JSONB,
    nominee_details JSONB,
    
    -- Coverage and riders
    base_coverage JSONB,
    riders JSONB DEFAULT '[]',
    addons JSONB DEFAULT '[]',
    
    -- Risk assessment
    underwriting_details JSONB,
    medical_reports JSONB DEFAULT '[]',
    
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unified commission structure
CREATE TABLE IF NOT EXISTS commission_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'base', 'slab', 'flat', 'tier', 'renewal'
    
    -- Applicability criteria
    criteria JSONB DEFAULT '{}', -- product, lob, channel, agent_type, etc.
    
    -- Commission rules consolidated
    rules JSONB NOT NULL, -- Contains all rule types: base_rate, slabs, tiers, etc.
    
    -- Validity and approval
    valid_from DATE NOT NULL,
    valid_to DATE,
    approval_status VARCHAR(50) DEFAULT 'active',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
    -- Audit trail
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unified documents table
CREATE TABLE IF NOT EXISTS documents_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'policy', 'agent', 'claim', etc.
    entity_id UUID NOT NULL,
    document_category VARCHAR(100) NOT NULL, -- 'kyc', 'medical', 'vehicle', etc.
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Document metadata
    metadata JSONB DEFAULT '{}',
    
    -- Verification and processing
    verification_status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    
    tenant_id UUID NOT NULL,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consolidated workflow and approvals
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'agent', 'policy', 'claim', etc.
    entity_id UUID NOT NULL,
    workflow_type VARCHAR(100) NOT NULL, -- 'agent_approval', 'policy_underwriting', etc.
    
    current_step VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    
    -- Workflow configuration and history
    workflow_config JSONB NOT NULL,
    step_history JSONB DEFAULT '[]',
    approvals JSONB DEFAULT '[]',
    
    -- Assignments and deadlines
    assigned_to UUID,
    assigned_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    
    tenant_id UUID NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE master_reference_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_details_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "tenant_isolation_master_reference" ON master_reference_data
    FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "tenant_isolation_products" ON products_unified
    FOR ALL USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "tenant_isolation_policy_details" ON policy_details_unified
    FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "tenant_isolation_commission" ON commission_structures
    FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "tenant_isolation_documents" ON documents_unified
    FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

CREATE POLICY "tenant_isolation_workflow" ON workflow_instances
    FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);