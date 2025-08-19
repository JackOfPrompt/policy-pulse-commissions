-- ============================================================================
-- EXECUTE PHASE 2: DATA MIGRATION (SAFE EXECUTION)
-- Run this script to migrate data from old tables to new optimized structure
-- ============================================================================

-- Enable timing and progress reporting
\timing on

-- Create temporary logging table for migration progress
CREATE TEMP TABLE migration_log (
    step_name TEXT,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    rows_processed INTEGER,
    status TEXT
);

-- Function to log migration steps
CREATE OR REPLACE FUNCTION log_migration_step(step TEXT, rows_count INTEGER, step_status TEXT DEFAULT 'SUCCESS') 
RETURNS VOID AS $$
BEGIN
    UPDATE migration_log 
    SET end_time = now(), rows_processed = rows_count, status = step_status 
    WHERE step_name = step AND end_time IS NULL;
    
    IF NOT FOUND THEN
        INSERT INTO migration_log (step_name, rows_processed, status, start_time, end_time) 
        VALUES (step, rows_count, step_status, now(), now());
    END IF;
    
    RAISE NOTICE 'Migration Step: % - Rows: % - Status: %', step, rows_count, step_status;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 1: Master Reference Data Migration
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Master Countries');

-- Migrate countries
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'country' as category,
    LEFT(country, 3) as code,
    country as name,
    jsonb_build_object('type', 'country', 'iso_code', LEFT(country, 3)) as metadata,
    NULL as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    MIN(created_at) as created_at,
    MAX(updated_at) as updated_at
FROM master_locations 
WHERE country IS NOT NULL AND country != ''
GROUP BY country, status;

SELECT log_migration_step('Master Countries', (SELECT COUNT(DISTINCT country) FROM master_locations WHERE country IS NOT NULL));

INSERT INTO migration_log (step_name) VALUES ('Master States');

-- Migrate states
WITH country_refs AS (
    SELECT id, name FROM master_reference_data WHERE category = 'country'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'state' as category,
    LEFT(ml.state, 5) as code,
    ml.state as name,
    cr.id as parent_id,
    jsonb_build_object(
        'type', 'state', 
        'country_name', ml.country,
        'state_code', LEFT(ml.state, 5)
    ) as metadata,
    NULL as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    MIN(ml.created_at) as created_at,
    MAX(ml.updated_at) as updated_at
FROM master_locations ml
JOIN country_refs cr ON cr.name = ml.country
WHERE ml.state IS NOT NULL AND ml.state != ''
GROUP BY ml.state, ml.country, ml.status, cr.id;

SELECT log_migration_step('Master States', (SELECT COUNT(DISTINCT state) FROM master_locations WHERE state IS NOT NULL));

INSERT INTO migration_log (step_name) VALUES ('Master Districts');

-- Migrate districts
WITH state_refs AS (
    SELECT id, name, metadata->>'country_name' as country_name 
    FROM master_reference_data WHERE category = 'state'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'district' as category,
    LEFT(ml.district, 10) as code,
    ml.district as name,
    sr.id as parent_id,
    jsonb_build_object(
        'type', 'district',
        'state_name', ml.state,
        'country_name', ml.country,
        'pincode_samples', array_agg(DISTINCT ml.pincode) FILTER (WHERE ml.pincode IS NOT NULL)
    ) as metadata,
    NULL as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    MIN(ml.created_at) as created_at,
    MAX(ml.updated_at) as updated_at
FROM master_locations ml
JOIN state_refs sr ON sr.name = ml.state AND sr.country_name = ml.country
WHERE ml.district IS NOT NULL AND ml.district != ''
GROUP BY ml.district, ml.state, ml.country, ml.status, sr.id;

SELECT log_migration_step('Master Districts', (SELECT COUNT(DISTINCT district) FROM master_locations WHERE district IS NOT NULL));

INSERT INTO migration_log (step_name) VALUES ('Master Departments');

-- Migrate departments
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'department' as category,
    department_code as code,
    department_name as name,
    jsonb_build_object(
        'type', 'department',
        'description', description,
        'branch_id', branch_id,
        'original_id', department_id
    ) as metadata,
    CASE WHEN tenant_id = 0 THEN NULL ELSE tenant_id::uuid END as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_departments
WHERE department_code IS NOT NULL;

SELECT log_migration_step('Master Departments', (SELECT COUNT(*) FROM master_departments));

INSERT INTO migration_log (step_name) VALUES ('Master Occupations');

-- Migrate occupations
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'occupation' as category,
    occupation_code as code,
    occupation_name as name,
    jsonb_build_object(
        'type', 'occupation',
        'description', description,
        'risk_category', risk_category,
        'original_id', occupation_id
    ) as metadata,
    NULL as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_occupations
WHERE occupation_code IS NOT NULL;

SELECT log_migration_step('Master Occupations', (SELECT COUNT(*) FROM master_occupations));

-- ===========================================
-- STEP 2: Products Migration
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Products Migration');

INSERT INTO products_unified (
    id, provider_id, lob_id, product_code, product_name, category, subcategory, 
    plan_type, product_config, pricing_config, eligibility_config, coverage_config,
    tenant_id, is_active, created_at, updated_at, created_by, updated_by
)
SELECT 
    p.product_id as id,
    p.provider_id,
    p.lob_id,
    p.product_code,
    p.product_name,
    
    -- Get category name if available
    COALESCE(pc.category_name, 'General') as category,
    COALESCE(psc.subcategory_name, 'Standard') as subcategory,
    COALESCE(pt.plan_type_name, 'Basic') as plan_type,
    
    -- Product configuration JSONB
    jsonb_build_object(
        'description', COALESCE(p.description, ''),
        'product_type', COALESCE(p.product_type, 'Standard'),
        'min_age', COALESCE(p.min_age, 0),
        'max_age', COALESCE(p.max_age, 100),
        'min_term', COALESCE(p.min_term, 1),
        'max_term', COALESCE(p.max_term, 50),
        'waiting_period', COALESCE(p.waiting_period, 0),
        'free_look_period', COALESCE(p.free_look_period, 15)
    ) as product_config,
    
    -- Pricing configuration
    jsonb_build_object(
        'base_premium', COALESCE(p.base_premium, 0),
        'currency', COALESCE(p.currency, 'INR'),
        'tax_applicable', COALESCE(p.tax_applicable, true),
        'commission_applicable', COALESCE(p.commission_applicable, true)
    ) as pricing_config,
    
    -- Eligibility configuration  
    jsonb_build_object(
        'min_age', COALESCE(p.min_age, 0),
        'max_age', COALESCE(p.max_age, 100),
        'gender_restrictions', COALESCE(p.gender_restrictions, 'None'),
        'medical_checkup_required', COALESCE(p.medical_checkup_required, false)
    ) as eligibility_config,
    
    -- Coverage configuration
    jsonb_build_object(
        'min_sum_insured', COALESCE(p.min_sum_insured, 0),
        'max_sum_insured', COALESCE(p.max_sum_insured, 0),
        'deductible_applicable', COALESCE(p.deductible_applicable, false),
        'co_payment_applicable', COALESCE(p.co_payment_applicable, false)
    ) as coverage_config,
    
    p.tenant_id,
    CASE WHEN COALESCE(p.status, 'Active') = 'Active' THEN true ELSE false END as is_active,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by
    
FROM products p
LEFT JOIN master_product_category pc ON p.category_id = pc.category_id
LEFT JOIN product_subcategory psc ON p.subcategory_id = psc.subcategory_id  
LEFT JOIN master_plan_types pt ON p.plan_type_id = pt.plan_type_id;

SELECT log_migration_step('Products Migration', (SELECT COUNT(*) FROM products));

-- ===========================================
-- STEP 3: Policy Details Migration (Motor)
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Motor Policy Migration');

INSERT INTO policy_details_unified (
    id, policy_id, lob_type, sum_insured, premium_amount, currency,
    motor_details, proposer_details, insured_details, base_coverage, 
    riders, addons, tenant_id, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    pmd.policy_id,
    'motor' as lob_type,
    pmd.sum_insured,
    pmd.premium_amount,
    COALESCE(pmd.currency, 'INR') as currency,
    
    -- Motor-specific details in JSONB
    jsonb_build_object(
        'vehicle_reg_no', pmd.vehicle_reg_no,
        'vehicle_type', pmd.vehicle_type,
        'make', pmd.make,
        'model', pmd.model,
        'variant', pmd.variant,
        'year_of_manufacture', pmd.year_of_manufacture,
        'fuel_type', pmd.fuel_type,
        'cc', pmd.cc,
        'seating_capacity', pmd.seating_capacity,
        'vehicle_value', pmd.vehicle_value,
        'previous_policy_no', pmd.previous_policy_no,
        'no_claim_bonus', pmd.no_claim_bonus,
        'is_financed', pmd.is_financed,
        'financier_name', pmd.financier_name,
        'hypothecation_city', pmd.hypothecation_city
    ) as motor_details,
    
    -- Proposer details
    jsonb_build_object(
        'name', pmd.proposer_name,
        'email', pmd.proposer_email,
        'phone', pmd.proposer_phone,
        'address', pmd.proposer_address,
        'city', pmd.proposer_city,
        'pincode', pmd.proposer_pincode
    ) as proposer_details,
    
    -- Insured details (same as proposer for motor)
    jsonb_build_object(
        'name', pmd.proposer_name,
        'email', pmd.proposer_email,
        'phone', pmd.proposer_phone
    ) as insured_details,
    
    -- Base coverage
    jsonb_build_object(
        'coverage_type', pmd.coverage_type,
        'policy_type', pmd.policy_type,
        'deductible', pmd.deductible
    ) as base_coverage,
    
    '[]'::jsonb as riders,
    '[]'::jsonb as addons,
    
    p.tenant_id,
    pmd.created_at,
    pmd.updated_at
    
FROM policy_motor_details pmd
JOIN policies p ON pmd.policy_id = p.policy_id
WHERE EXISTS (SELECT 1 FROM policies WHERE policy_id = pmd.policy_id);

SELECT log_migration_step('Motor Policy Migration', (SELECT COUNT(*) FROM policy_motor_details));

-- ===========================================
-- STEP 4: Policy Details Migration (Health)
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Health Policy Migration');

INSERT INTO policy_details_unified (
    id, policy_id, lob_type, sum_insured, premium_amount, currency,
    health_details, proposer_details, insured_details, nominee_details,
    base_coverage, riders, addons, medical_reports, tenant_id, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    phd.policy_id,
    'health' as lob_type,
    phd.sum_insured,
    phd.premium_amount,
    COALESCE(phd.currency, 'INR') as currency,
    
    -- Health-specific details in JSONB
    jsonb_build_object(
        'policy_type', phd.policy_type,
        'family_definition', phd.family_definition,
        'pre_existing_diseases', phd.pre_existing_diseases,
        'medical_history', phd.medical_history,
        'lifestyle_habits', phd.lifestyle_habits,
        'occupation_details', phd.occupation_details,
        'annual_income', phd.annual_income,
        'room_rent_limit', phd.room_rent_limit,
        'copay_percentage', phd.copay_percentage,
        'waiting_period_waiver', phd.waiting_period_waiver
    ) as health_details,
    
    -- Proposer details
    jsonb_build_object(
        'name', phd.proposer_name,
        'email', phd.proposer_email,
        'phone', phd.proposer_phone,
        'date_of_birth', phd.proposer_dob,
        'gender', phd.proposer_gender,
        'address', phd.proposer_address,
        'city', phd.proposer_city,
        'pincode', phd.proposer_pincode,
        'occupation', phd.proposer_occupation,
        'annual_income', phd.proposer_annual_income
    ) as proposer_details,
    
    -- Insured details
    jsonb_build_object(
        'members', phd.insured_members,
        'primary_insured', phd.primary_insured_name,
        'relationships', phd.member_relationships
    ) as insured_details,
    
    -- Nominee details
    jsonb_build_object(
        'name', phd.nominee_name,
        'relationship', phd.nominee_relationship,
        'date_of_birth', phd.nominee_dob,
        'address', phd.nominee_address
    ) as nominee_details,
    
    -- Base coverage
    jsonb_build_object(
        'coverage_type', phd.coverage_type,
        'room_type', phd.room_type,
        'hospital_network', phd.hospital_network
    ) as base_coverage,
    
    '[]'::jsonb as riders,
    '[]'::jsonb as addons,
    COALESCE(phd.medical_reports, '[]'::jsonb) as medical_reports,
    
    p.tenant_id,
    phd.created_at,
    phd.updated_at
    
FROM policy_health_details phd
JOIN policies p ON phd.policy_id = p.policy_id
WHERE EXISTS (SELECT 1 FROM policies WHERE policy_id = phd.policy_id);

SELECT log_migration_step('Health Policy Migration', (SELECT COUNT(*) FROM policy_health_details));

-- ===========================================
-- STEP 5: Policy Details Migration (Life)
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Life Policy Migration');

INSERT INTO policy_details_unified (
    id, policy_id, lob_type, sum_insured, premium_amount, currency,
    life_details, proposer_details, insured_details, nominee_details,
    base_coverage, riders, addons, tenant_id, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    pld.policy_id,
    'life' as lob_type,
    pld.sum_insured,
    pld.premium_amount,
    COALESCE(pld.currency, 'INR') as currency,
    
    -- Life-specific details in JSONB
    jsonb_build_object(
        'policy_type', pld.policy_type,
        'plan_variant', pld.plan_variant,
        'premium_payment_term', pld.premium_payment_term,
        'policy_term', pld.policy_term,
        'maturity_benefit', pld.maturity_benefit,
        'death_benefit', pld.death_benefit,
        'surrender_value', pld.surrender_value,
        'loan_facility', pld.loan_facility,
        'bonus_applicable', pld.bonus_applicable,
        'participating', pld.participating,
        'medical_checkup_done', pld.medical_checkup_done
    ) as life_details,
    
    -- Proposer details
    jsonb_build_object(
        'name', pld.proposer_name,
        'email', pld.proposer_email,
        'phone', pld.proposer_phone,
        'date_of_birth', pld.proposer_dob,
        'gender', pld.proposer_gender,
        'address', pld.proposer_address,
        'occupation', pld.proposer_occupation,
        'annual_income', pld.proposer_annual_income,
        'marital_status', pld.proposer_marital_status
    ) as proposer_details,
    
    -- Life assured details
    jsonb_build_object(
        'name', pld.life_assured_name,
        'date_of_birth', pld.life_assured_dob,
        'gender', pld.life_assured_gender,
        'relationship_with_proposer', pld.relationship_with_proposer,
        'occupation', pld.life_assured_occupation,
        'annual_income', pld.life_assured_annual_income
    ) as insured_details,
    
    -- Nominee details
    jsonb_build_object(
        'primary_nominee', jsonb_build_object(
            'name', pld.nominee_name,
            'relationship', pld.nominee_relationship,
            'date_of_birth', pld.nominee_dob,
            'share_percentage', pld.nominee_share
        ),
        'contingent_nominee', pld.contingent_nominee_details,
        'appointee_details', pld.appointee_details
    ) as nominee_details,
    
    -- Base coverage
    jsonb_build_object(
        'coverage_type', pld.coverage_type,
        'benefit_structure', pld.benefit_structure
    ) as base_coverage,
    
    '[]'::jsonb as riders,
    '[]'::jsonb as addons,
    
    p.tenant_id,
    pld.created_at,
    pld.updated_at
    
FROM policy_life_details pld
JOIN policies p ON pld.policy_id = p.policy_id
WHERE EXISTS (SELECT 1 FROM policies WHERE policy_id = pld.policy_id);

SELECT log_migration_step('Life Policy Migration', (SELECT COUNT(*) FROM policy_life_details));

-- ===========================================
-- STEP 6: Commission Structures Migration
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Commission Migration');

INSERT INTO commission_structures (
    id, tenant_id, rule_name, rule_type, criteria, rules,
    valid_from, valid_to, approval_status, approved_by, approved_at,
    created_by, updated_by, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    cr.tenant_id,
    CONCAT('Rule-', cr.rule_id, '-', COALESCE(cr.channel, 'General')) as rule_name,
    COALESCE(cr.rule_type, 'base') as rule_type,
    
    -- Criteria JSONB
    jsonb_build_object(
        'product_id', cr.product_id,
        'insurer_id', cr.insurer_id,
        'lob_id', cr.lob_id,
        'channel', cr.channel,
        'policy_year', COALESCE(cr.policy_year, 1)
    ) as criteria,
    
    -- Rules JSONB - comprehensive structure
    jsonb_build_object(
        'base_rate', COALESCE(cr.base_rate, 0),
        'slabs', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'min_value', cs.min_value,
                    'max_value', cs.max_value,
                    'rate', cs.rate,
                    'slab_type', COALESCE(cs.slab_type, 'Premium')
                )
            ) 
            FROM commission_slabs cs 
            WHERE cs.rule_id = cr.rule_id),
            '[]'::jsonb
        )
    ) as rules,
    
    cr.valid_from,
    cr.valid_to,
    COALESCE(cr.status, 'active') as approval_status,
    cr.created_by as approved_by,
    cr.created_at as approved_at,
    cr.created_by,
    cr.updated_by,
    cr.created_at,
    cr.updated_at
    
FROM commission_rules cr
WHERE cr.rule_id IS NOT NULL;

SELECT log_migration_step('Commission Migration', (SELECT COUNT(*) FROM commission_rules));

-- ===========================================
-- STEP 7: Documents Migration
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Documents Migration');

-- Migrate policy documents
INSERT INTO documents_unified (
    id, entity_type, entity_id, document_category, document_type,
    file_name, file_path, file_size, mime_type, metadata,
    verification_status, tenant_id, uploaded_by, created_at, updated_at
)
SELECT 
    COALESCE(pd.document_id, gen_random_uuid()) as id,
    'policy' as entity_type,
    pd.policy_id as entity_id,
    COALESCE(pd.document_category, 'general') as document_category,
    COALESCE(pd.document_type, 'document') as document_type,
    pd.file_name,
    pd.file_path,
    pd.file_size,
    pd.mime_type,
    
    -- Metadata JSONB
    jsonb_build_object(
        'document_number', pd.document_number,
        'issued_date', pd.issued_date,
        'expiry_date', pd.expiry_date,
        'issuing_authority', pd.issuing_authority,
        'description', pd.description
    ) as metadata,
    
    COALESCE(pd.verification_status, 'pending') as verification_status,
    p.tenant_id,
    pd.uploaded_by,
    pd.created_at,
    pd.updated_at
    
FROM policy_documents pd
JOIN policies p ON pd.policy_id = p.policy_id
WHERE pd.file_name IS NOT NULL;

-- Migrate general documents  
INSERT INTO documents_unified (
    id, entity_type, entity_id, document_category, document_type,
    file_name, file_path, file_size, mime_type, metadata,
    verification_status, tenant_id, uploaded_by, created_at, updated_at
)
SELECT 
    d.id,
    d.entity_type,
    d.entity_id,
    COALESCE(d.document_type, 'general') as document_category,
    d.document_type,
    d.file_name,
    d.file_url as file_path,
    d.file_size,
    d.mime_type,
    
    -- Metadata JSONB
    jsonb_build_object(
        'status', d.status,
        'original_table', 'documents'
    ) as metadata,
    
    COALESCE(d.status, 'pending') as verification_status,
    d.tenant_id,
    d.uploaded_by,
    d.created_at,
    d.updated_at
    
FROM documents d
WHERE d.file_name IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM documents_unified du 
    WHERE du.id = d.id
);

SELECT log_migration_step('Documents Migration', 
    (SELECT COUNT(*) FROM policy_documents) + (SELECT COUNT(*) FROM documents));

-- ===========================================
-- STEP 8: Workflow Instances (Agent Approvals)
-- ===========================================

INSERT INTO migration_log (step_name) VALUES ('Workflow Migration');

INSERT INTO workflow_instances (
    id, entity_type, entity_id, workflow_type, current_step, status,
    workflow_config, step_history, approvals, assigned_to, assigned_at,
    tenant_id, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    'agent' as entity_type,
    aa.agent_id::uuid as entity_id,
    'agent_approval' as workflow_type,
    CASE 
        WHEN aa.decision = 'approved' THEN 'completed'
        WHEN aa.decision = 'rejected' THEN 'rejected' 
        ELSE 'pending_approval'
    END as current_step,
    CASE 
        WHEN aa.decision = 'approved' THEN 'completed'
        WHEN aa.decision = 'rejected' THEN 'rejected'
        ELSE 'in_progress'
    END as status,
    
    -- Workflow configuration
    jsonb_build_object(
        'approval_levels', aa.level,
        'auto_approval', false,
        'required_documents', '[]'
    ) as workflow_config,
    
    -- Step history
    jsonb_build_array(
        jsonb_build_object(
            'step', 'submitted',
            'timestamp', a.created_at,
            'actor', a.created_by,
            'status', 'completed'
        ),
        jsonb_build_object(
            'step', 'approval_level_' || aa.level,
            'timestamp', COALESCE(aa.decision_date, aa.created_at),
            'actor', aa.approver_id,
            'status', COALESCE(aa.decision, 'pending'),
            'comments', aa.comments
        )
    ) as step_history,
    
    -- Approvals array
    jsonb_build_array(
        jsonb_build_object(
            'level', aa.level,
            'approver_id', aa.approver_id,
            'decision', aa.decision,
            'decision_date', aa.decision_date,
            'comments', aa.comments
        )
    ) as approvals,
    
    aa.approver_id as assigned_to,
    aa.created_at as assigned_at,
    a.tenant_id,
    a.created_by,
    aa.created_at,
    COALESCE(aa.decision_date, aa.created_at) as updated_at
    
FROM agent_approvals aa
JOIN agents a ON aa.agent_id = a.agent_id
WHERE aa.approval_id IS NOT NULL;

SELECT log_migration_step('Workflow Migration', (SELECT COUNT(*) FROM agent_approvals));

-- ===========================================
-- MIGRATION COMPLETE - SUMMARY REPORT
-- ===========================================

-- Display migration summary
\echo ''
\echo '============================================='
\echo 'MIGRATION COMPLETED SUCCESSFULLY!'
\echo '============================================='

SELECT 
    step_name,
    rows_processed,
    status,
    EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER as duration_seconds
FROM migration_log
ORDER BY start_time;

-- Final counts verification
\echo ''
\echo 'FINAL VERIFICATION COUNTS:'
\echo '========================='

SELECT 'master_reference_data' as table_name, COUNT(*) as record_count FROM master_reference_data
UNION ALL
SELECT 'products_unified', COUNT(*) FROM products_unified  
UNION ALL
SELECT 'policy_details_unified', COUNT(*) FROM policy_details_unified
UNION ALL
SELECT 'commission_structures', COUNT(*) FROM commission_structures
UNION ALL
SELECT 'documents_unified', COUNT(*) FROM documents_unified
UNION ALL
SELECT 'workflow_instances', COUNT(*) FROM workflow_instances
ORDER BY table_name;

\echo ''
\echo 'Next Steps:'
\echo '1. Run verification queries (phase3_verification_queries.sql)'
\echo '2. Test application with new schema'  
\echo '3. Once confirmed, execute cleanup to drop old tables'
\echo ''

-- Clean up temporary function
DROP FUNCTION log_migration_step(TEXT, INTEGER, TEXT);