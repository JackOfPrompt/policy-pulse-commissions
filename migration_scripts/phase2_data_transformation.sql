-- ============================================================================
-- PHASE 2: DATA TRANSFORMATION AND MIGRATION SCRIPTS
-- ============================================================================

-- ===========================================
-- Master Reference Data Consolidation
-- ===========================================

-- Migrate master_locations → master_reference_data
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'country' as category,
    LEFT(country, 3) as code,
    country as name,
    NULL as parent_id,
    jsonb_build_object('type', 'country') as metadata,
    NULL as tenant_id, -- Global reference
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_locations 
WHERE country IS NOT NULL
GROUP BY country, status, created_at, updated_at;

-- Insert states with country as parent
WITH country_mapping AS (
    SELECT id, name as country_name 
    FROM master_reference_data 
    WHERE category = 'country'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'state' as category,
    LEFT(ml.state, 3) as code,
    ml.state as name,
    cm.id as parent_id,
    jsonb_build_object('type', 'state', 'country_code', LEFT(ml.country, 3)) as metadata,
    NULL as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    ml.created_at,
    ml.updated_at
FROM master_locations ml
JOIN country_mapping cm ON cm.country_name = ml.country
WHERE ml.state IS NOT NULL;

-- Insert districts/cities with state as parent
WITH state_mapping AS (
    SELECT id, name as state_name, 
           (metadata->>'country_code') as country_code
    FROM master_reference_data 
    WHERE category = 'state'
)
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT DISTINCT
    'district' as category,
    LEFT(ml.district, 10) as code,
    ml.district as name,
    sm.id as parent_id,
    jsonb_build_object(
        'type', 'district',
        'state_name', ml.state,
        'country_name', ml.country,
        'pincode', ml.pincode
    ) as metadata,
    NULL as tenant_id,
    CASE WHEN ml.status = 'Active' THEN true ELSE false END as is_active,
    ml.created_at,
    ml.updated_at
FROM master_locations ml
JOIN state_mapping sm ON sm.state_name = ml.state
WHERE ml.district IS NOT NULL;

-- Migrate master_departments → master_reference_data
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'department' as category,
    department_code as code,
    department_name as name,
    NULL as parent_id,
    jsonb_build_object(
        'description', description,
        'branch_id', branch_id,
        'department_id', department_id
    ) as metadata,
    tenant_id::uuid as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_departments;

-- Migrate master_occupations → master_reference_data
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'occupation' as category,
    occupation_code as code,
    occupation_name as name,
    NULL as parent_id,
    jsonb_build_object(
        'description', description,
        'risk_category', risk_category,
        'occupation_id', occupation_id
    ) as metadata,
    NULL as tenant_id, -- Global reference
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_occupations;

-- Migrate other master tables similarly...
INSERT INTO master_reference_data (category, code, name, parent_id, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'business_category' as category,
    category_code as code,
    category_name as name,
    NULL as parent_id,
    jsonb_build_object(
        'description', description,
        'category_id', category_id
    ) as metadata,
    NULL as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_business_categories;

-- ===========================================
-- Products Unification
-- ===========================================

-- Migrate products → products_unified
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
    pc.category_name as category,
    psc.subcategory_name as subcategory,
    pt.plan_type_name as plan_type,
    
    -- Product configuration JSONB
    jsonb_build_object(
        'description', p.description,
        'product_type', p.product_type,
        'min_age', p.min_age,
        'max_age', p.max_age,
        'min_term', p.min_term,
        'max_term', p.max_term,
        'waiting_period', p.waiting_period,
        'free_look_period', p.free_look_period
    ) as product_config,
    
    -- Pricing configuration
    jsonb_build_object(
        'base_premium', p.base_premium,
        'currency', COALESCE(p.currency, 'INR'),
        'tax_applicable', p.tax_applicable,
        'commission_applicable', p.commission_applicable
    ) as pricing_config,
    
    -- Eligibility configuration  
    jsonb_build_object(
        'min_age', p.min_age,
        'max_age', p.max_age,
        'gender_restrictions', p.gender_restrictions,
        'medical_checkup_required', p.medical_checkup_required
    ) as eligibility_config,
    
    -- Coverage configuration
    jsonb_build_object(
        'min_sum_insured', p.min_sum_insured,
        'max_sum_insured', p.max_sum_insured,
        'deductible_applicable', p.deductible_applicable,
        'co_payment_applicable', p.co_payment_applicable
    ) as coverage_config,
    
    p.tenant_id,
    CASE WHEN p.status = 'Active' THEN true ELSE false END as is_active,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by
    
FROM products p
LEFT JOIN master_product_category pc ON p.category_id = pc.category_id
LEFT JOIN product_subcategory psc ON p.subcategory_id = psc.subcategory_id  
LEFT JOIN master_plan_types pt ON p.plan_type_id = pt.plan_type_id;

-- ===========================================
-- Policy Details Unification
-- ===========================================

-- Migrate motor policy details
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
    
    -- Riders (to be populated from separate riders table if exists)
    '[]'::jsonb as riders,
    
    -- Addons (to be populated from separate addons table if exists)  
    '[]'::jsonb as addons,
    
    p.tenant_id,
    pmd.created_at,
    pmd.updated_at
    
FROM policy_motor_details pmd
JOIN policies p ON pmd.policy_id = p.policy_id;

-- Migrate health policy details
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
    
    -- Riders
    '[]'::jsonb as riders,
    
    -- Addons
    '[]'::jsonb as addons,
    
    -- Medical reports
    COALESCE(phd.medical_reports, '[]'::jsonb) as medical_reports,
    
    p.tenant_id,
    phd.created_at,
    phd.updated_at
    
FROM policy_health_details phd
JOIN policies p ON phd.policy_id = p.policy_id;

-- Migrate life policy details
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
    
    -- Riders
    '[]'::jsonb as riders,
    
    -- Addons  
    '[]'::jsonb as addons,
    
    p.tenant_id,
    pld.created_at,
    pld.updated_at
    
FROM policy_life_details pld
JOIN policies p ON pld.policy_id = p.policy_id;

-- ===========================================
-- Commission Structures Consolidation
-- ===========================================

-- Migrate base commission rules
INSERT INTO commission_structures (
    id, tenant_id, rule_name, rule_type, criteria, rules,
    valid_from, valid_to, approval_status, approved_by, approved_at,
    created_by, updated_by, created_at, updated_at
)
SELECT 
    cr.rule_id::uuid as id,
    cr.tenant_id,
    CONCAT('Base Rate - ', p.product_name, ' - ', cr.channel) as rule_name,
    'base' as rule_type,
    
    -- Criteria JSONB
    jsonb_build_object(
        'product_id', cr.product_id,
        'insurer_id', cr.insurer_id,
        'lob_id', cr.lob_id,
        'channel', cr.channel,
        'policy_year', cr.policy_year
    ) as criteria,
    
    -- Rules JSONB containing base rate and any slabs
    jsonb_build_object(
        'base_rate', cr.base_rate,
        'slabs', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'min_value', cs.min_value,
                    'max_value', cs.max_value,
                    'rate', cs.rate,
                    'slab_type', cs.slab_type
                )
            ) 
            FROM commission_slabs cs 
            WHERE cs.rule_id = cr.rule_id),
            '[]'::jsonb
        ),
        'flat_amounts', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'flat_amount', cf.flat_amount,
                    'unit_type', cf.unit_type
                )
            )
            FROM commission_flat cf
            WHERE cf.rule_id = cr.rule_id),
            '[]'::jsonb
        ),
        'renewal_rates', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'policy_year', cr_renewal.policy_year,
                    'renewal_rate', cr_renewal.renewal_rate
                )
            )
            FROM commission_renewal cr_renewal
            WHERE cr_renewal.rule_id = cr.rule_id),
            '[]'::jsonb
        ),
        'business_bonus', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'min_gwp', cbb.min_gwp,
                    'max_gwp', cbb.max_gwp,
                    'bonus_rate', cbb.bonus_rate,
                    'period_type', cbb.period_type
                )
            )
            FROM commission_business_bonus cbb
            WHERE cbb.rule_id = cr.rule_id),
            '[]'::jsonb
        ),
        'tiers', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'tier_name', ct.tier_name,
                    'min_business', ct.min_business,
                    'max_business', ct.max_business,
                    'extra_bonus', ct.extra_bonus
                )
            )
            FROM commission_tiers ct
            WHERE ct.rule_id = cr.rule_id),
            '[]'::jsonb
        ),
        'time_bonuses', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'campaign_name', ctb.campaign_name,
                    'bonus_rate', ctb.bonus_rate,
                    'valid_from', ctb.valid_from,
                    'valid_to', ctb.valid_to
                )
            )
            FROM commission_time_bonus ctb
            WHERE ctb.rule_id = cr.rule_id),
            '[]'::jsonb
        )
    ) as rules,
    
    cr.valid_from,
    cr.valid_to,
    cr.status as approval_status,
    cr.created_by as approved_by,
    cr.created_at as approved_at,
    cr.created_by,
    cr.updated_by,
    cr.created_at,
    cr.updated_at
    
FROM commission_rules cr
LEFT JOIN products_unified p ON cr.product_id = p.id
WHERE cr.status = 'Active';

-- ===========================================
-- Documents Unification  
-- ===========================================

-- Migrate policy documents
INSERT INTO documents_unified (
    id, entity_type, entity_id, document_category, document_type,
    file_name, file_path, file_size, mime_type, metadata,
    verification_status, tenant_id, uploaded_by, created_at, updated_at
)
SELECT 
    pd.document_id as id,
    'policy' as entity_type,
    pd.policy_id as entity_id,
    COALESCE(pd.document_category, 'general') as document_category,
    pd.document_type,
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
JOIN policies p ON pd.policy_id = p.policy_id;

-- Migrate general documents table
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
        'original_entity_type', d.entity_type
    ) as metadata,
    
    COALESCE(d.status, 'pending') as verification_status,
    d.tenant_id,
    d.uploaded_by,
    d.created_at,
    d.updated_at
    
FROM documents d;

-- ===========================================
-- Workflow Instances (Agent Approvals, etc.)
-- ===========================================

-- Migrate agent approvals to workflow instances
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
JOIN agents a ON aa.agent_id = a.agent_id;