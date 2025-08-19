-- ============================================================================
-- PHASE 4: ROLLBACK SCRIPTS - RESTORE ORIGINAL SCHEMA
-- ============================================================================
-- WARNING: These scripts will DROP the new unified tables and restore
-- the original table structure. Only execute if migration fails.
-- ============================================================================

-- ===========================================
-- Step 1: Backup New Tables (Optional Safety)
-- ===========================================

-- Create backup tables with timestamp
DO $$
DECLARE
    backup_suffix TEXT := '_backup_' || to_char(now(), 'YYYYMMDD_HH24MI');
BEGIN
    -- Backup new tables before dropping
    EXECUTE format('CREATE TABLE master_reference_data%s AS SELECT * FROM master_reference_data', backup_suffix);
    EXECUTE format('CREATE TABLE products_unified%s AS SELECT * FROM products_unified', backup_suffix);
    EXECUTE format('CREATE TABLE policy_details_unified%s AS SELECT * FROM policy_details_unified', backup_suffix);
    EXECUTE format('CREATE TABLE commission_structures%s AS SELECT * FROM commission_structures', backup_suffix);
    EXECUTE format('CREATE TABLE documents_unified%s AS SELECT * FROM documents_unified', backup_suffix);
    EXECUTE format('CREATE TABLE workflow_instances%s AS SELECT * FROM workflow_instances', backup_suffix);
    
    RAISE NOTICE 'Backup tables created with suffix: %', backup_suffix;
END $$;

-- ===========================================
-- Step 2: Drop New Unified Tables and Policies
-- ===========================================

-- Drop RLS policies first
DROP POLICY IF EXISTS "tenant_isolation_master_reference" ON master_reference_data;
DROP POLICY IF EXISTS "tenant_isolation_products" ON products_unified;
DROP POLICY IF EXISTS "tenant_isolation_policy_details" ON policy_details_unified;
DROP POLICY IF EXISTS "tenant_isolation_commission" ON commission_structures;
DROP POLICY IF EXISTS "tenant_isolation_documents" ON documents_unified;
DROP POLICY IF EXISTS "tenant_isolation_workflow" ON workflow_instances;

-- Drop indexes
DROP INDEX IF EXISTS idx_master_reference_category;
DROP INDEX IF EXISTS idx_master_reference_tenant;
DROP INDEX IF EXISTS idx_master_reference_parent;

-- Drop the new tables
DROP TABLE IF EXISTS workflow_instances;
DROP TABLE IF EXISTS documents_unified;
DROP TABLE IF EXISTS commission_structures;
DROP TABLE IF EXISTS policy_details_unified;
DROP TABLE IF EXISTS products_unified;
DROP TABLE IF EXISTS master_reference_data;

-- ===========================================
-- Step 3: Restore Original Table Structure (if needed)
-- ===========================================

-- If original tables were dropped during migration, recreate them
-- NOTE: This assumes you have backups of the original table schemas

-- Restore master_locations if it was modified
CREATE TABLE IF NOT EXISTS master_locations_restored (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country VARCHAR(100),
    state VARCHAR(100), 
    district VARCHAR(100),
    pincode VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Restore master_departments if it was modified  
CREATE TABLE IF NOT EXISTS master_departments_restored (
    department_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    branch_id INTEGER,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restore products table structure
CREATE TABLE IF NOT EXISTS products_restored (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL,
    lob_id UUID NOT NULL,
    category_id UUID,
    subcategory_id UUID,
    plan_type_id UUID,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    product_type VARCHAR(100),
    min_age INTEGER,
    max_age INTEGER,
    min_term INTEGER,
    max_term INTEGER,
    waiting_period INTEGER,
    free_look_period INTEGER,
    base_premium DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    tax_applicable BOOLEAN DEFAULT true,
    commission_applicable BOOLEAN DEFAULT true,
    min_sum_insured DECIMAL(15,2),
    max_sum_insured DECIMAL(15,2),
    deductible_applicable BOOLEAN DEFAULT false,
    co_payment_applicable BOOLEAN DEFAULT false,
    medical_checkup_required BOOLEAN DEFAULT false,
    gender_restrictions VARCHAR(20),
    tenant_id UUID,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Restore LOB-specific policy tables
CREATE TABLE IF NOT EXISTS policy_motor_details_restored (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    vehicle_reg_no VARCHAR(20),
    vehicle_type VARCHAR(50),
    make VARCHAR(100),
    model VARCHAR(100),
    variant VARCHAR(100),
    year_of_manufacture INTEGER,
    fuel_type VARCHAR(20),
    cc INTEGER,
    seating_capacity INTEGER,
    vehicle_value DECIMAL(15,2),
    sum_insured DECIMAL(15,2),
    premium_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    coverage_type VARCHAR(50),
    policy_type VARCHAR(50),
    deductible DECIMAL(15,2),
    no_claim_bonus DECIMAL(5,2),
    previous_policy_no VARCHAR(50),
    is_financed BOOLEAN DEFAULT false,
    financier_name VARCHAR(255),
    hypothecation_city VARCHAR(100),
    proposer_name VARCHAR(255),
    proposer_email VARCHAR(255),
    proposer_phone VARCHAR(20),
    proposer_address TEXT,
    proposer_city VARCHAR(100),
    proposer_pincode VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_health_details_restored (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    policy_type VARCHAR(100),
    family_definition VARCHAR(100),
    sum_insured DECIMAL(15,2),
    premium_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    coverage_type VARCHAR(50),
    room_type VARCHAR(50),
    room_rent_limit DECIMAL(15,2),
    copay_percentage DECIMAL(5,2),
    hospital_network VARCHAR(100),
    pre_existing_diseases TEXT,
    medical_history TEXT,
    lifestyle_habits TEXT,
    occupation_details TEXT,
    annual_income DECIMAL(15,2),
    waiting_period_waiver BOOLEAN DEFAULT false,
    proposer_name VARCHAR(255),
    proposer_email VARCHAR(255),
    proposer_phone VARCHAR(20),
    proposer_dob DATE,
    proposer_gender VARCHAR(10),
    proposer_address TEXT,
    proposer_city VARCHAR(100),
    proposer_pincode VARCHAR(10),
    proposer_occupation VARCHAR(100),
    proposer_annual_income DECIMAL(15,2),
    insured_members JSONB,
    primary_insured_name VARCHAR(255),
    member_relationships JSONB,
    nominee_name VARCHAR(255),
    nominee_relationship VARCHAR(50),
    nominee_dob DATE,
    nominee_address TEXT,
    medical_reports JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_life_details_restored (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    policy_type VARCHAR(100),
    plan_variant VARCHAR(100),
    sum_insured DECIMAL(15,2),
    premium_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    premium_payment_term INTEGER,
    policy_term INTEGER,
    maturity_benefit DECIMAL(15,2),
    death_benefit DECIMAL(15,2),
    surrender_value DECIMAL(15,2),
    loan_facility BOOLEAN DEFAULT false,
    bonus_applicable BOOLEAN DEFAULT false,
    participating BOOLEAN DEFAULT false,
    medical_checkup_done BOOLEAN DEFAULT false,
    coverage_type VARCHAR(50),
    benefit_structure VARCHAR(100),
    proposer_name VARCHAR(255),
    proposer_email VARCHAR(255),
    proposer_phone VARCHAR(20),
    proposer_dob DATE,
    proposer_gender VARCHAR(10),
    proposer_address TEXT,
    proposer_occupation VARCHAR(100),
    proposer_annual_income DECIMAL(15,2),
    proposer_marital_status VARCHAR(20),
    life_assured_name VARCHAR(255),
    life_assured_dob DATE,
    life_assured_gender VARCHAR(10),
    relationship_with_proposer VARCHAR(50),
    life_assured_occupation VARCHAR(100),
    life_assured_annual_income DECIMAL(15,2),
    nominee_name VARCHAR(255),
    nominee_relationship VARCHAR(50),
    nominee_dob DATE,
    nominee_share DECIMAL(5,2),
    contingent_nominee_details JSONB,
    appointee_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Restore original commission tables structure
CREATE TABLE IF NOT EXISTS commission_rules_restored (
    rule_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    product_id UUID,
    insurer_id UUID,
    lob_id UUID,
    channel VARCHAR(50),
    policy_year INTEGER DEFAULT 1,
    base_rate DECIMAL(5,4),
    valid_from DATE NOT NULL,
    valid_to DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commission_slabs_restored (
    slab_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules_restored(rule_id),
    min_value DECIMAL(15,2) NOT NULL,
    max_value DECIMAL(15,2),
    rate DECIMAL(5,4) NOT NULL,
    slab_type VARCHAR(20) DEFAULT 'Premium',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commission_flat_restored (
    flat_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules_restored(rule_id),
    flat_amount DECIMAL(15,2) NOT NULL,
    unit_type VARCHAR(20) DEFAULT 'PerPolicy',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commission_renewal_restored (
    renewal_id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES commission_rules_restored(rule_id),
    policy_year INTEGER NOT NULL,
    renewal_rate DECIMAL(5,4) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Restore documents table structure
CREATE TABLE IF NOT EXISTS policy_documents_restored (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_category VARCHAR(100),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    document_number VARCHAR(100),
    issued_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),
    description TEXT,
    verification_status VARCHAR(50) DEFAULT 'pending',
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents_restored (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    tenant_id UUID NOT NULL,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Restore agent approvals table
CREATE TABLE IF NOT EXISTS agent_approvals_restored (
    approval_id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    approver_id UUID NOT NULL,
    level INTEGER NOT NULL,
    decision VARCHAR(20),
    decision_date TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Step 4: Restore Original RLS Policies
-- ===========================================

-- Enable RLS on restored tables
ALTER TABLE master_locations_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_departments_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_motor_details_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_health_details_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_life_details_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents_restored ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_restored ENABLE ROW LEVEL SECURITY;

-- Restore original RLS policies (adjust based on your original policies)
-- Example policies - adjust as needed for your original schema

CREATE POLICY "Allow authenticated users to read master locations" 
ON master_locations_restored FOR SELECT TO authenticated USING (true);

CREATE POLICY "System admins can manage master locations" 
ON master_locations_restored FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "Allow authenticated users to read master departments" 
ON master_departments_restored FOR SELECT TO authenticated USING (true);

CREATE POLICY "System admins can manage master departments" 
ON master_departments_restored FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

-- Add similar policies for other tables...

-- ===========================================
-- Step 5: Restore Original Indexes
-- ===========================================

-- Restore indexes on original table structure
CREATE INDEX IF NOT EXISTS idx_master_locations_country ON master_locations_restored(country);
CREATE INDEX IF NOT EXISTS idx_master_locations_state ON master_locations_restored(state);
CREATE INDEX IF NOT EXISTS idx_master_locations_pincode ON master_locations_restored(pincode);

CREATE INDEX IF NOT EXISTS idx_master_departments_tenant ON master_departments_restored(tenant_id);
CREATE INDEX IF NOT EXISTS idx_master_departments_status ON master_departments_restored(status);

CREATE INDEX IF NOT EXISTS idx_products_provider ON products_restored(provider_id);
CREATE INDEX IF NOT EXISTS idx_products_lob ON products_restored(lob_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products_restored(tenant_id);

CREATE INDEX IF NOT EXISTS idx_policy_motor_policy ON policy_motor_details_restored(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_health_policy ON policy_health_details_restored(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_life_policy ON policy_life_details_restored(policy_id);

CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant ON commission_rules_restored(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_product ON commission_rules_restored(product_id);
CREATE INDEX IF NOT EXISTS idx_commission_slabs_rule ON commission_slabs_restored(rule_id);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents_restored(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents_restored(tenant_id);

-- ===========================================
-- Step 6: Rollback Verification
-- ===========================================

-- Verify rollback was successful
SELECT 
    'ROLLBACK VERIFICATION' as status,
    now() as timestamp
UNION ALL
SELECT '===================' as status, null as timestamp
UNION ALL
SELECT 
    CONCAT('Restored tables count: ', COUNT(*)) as status,
    null as timestamp
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%_restored'
UNION ALL
SELECT 
    CONCAT('New tables removed: ', 
        CASE WHEN COUNT(*) = 0 THEN 'YES' ELSE 'NO - Some tables still exist' END
    ) as status,
    null as timestamp
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'master_reference_data', 'products_unified', 'policy_details_unified',
    'commission_structures', 'documents_unified', 'workflow_instances'
)
UNION ALL
SELECT 'Rollback completed!' as status, null as timestamp;

-- ===========================================
-- Step 7: Post-Rollback Actions
-- ===========================================

-- Instructions for manual steps after rollback:
/*
MANUAL STEPS REQUIRED AFTER ROLLBACK:

1. Rename restored tables to original names:
   - ALTER TABLE master_locations_restored RENAME TO master_locations;
   - ALTER TABLE master_departments_restored RENAME TO master_departments;
   - etc.

2. Update application configuration:
   - Revert any application code that was changed to use new schema
   - Update API endpoints to use original table structure
   - Restore original queries and stored procedures

3. Verify data integrity:
   - Run original application tests
   - Check that all original functionality works
   - Validate that no data was lost during rollback

4. Clean up backup tables:
   - Drop the backup tables with timestamp suffix if rollback is successful
   - Or keep them for additional safety

5. Update documentation:
   - Document the rollback process
   - Note any issues encountered during migration
   - Plan for future migration attempts with fixes
*/