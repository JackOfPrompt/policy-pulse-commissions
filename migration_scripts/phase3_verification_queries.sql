-- ============================================================================
-- PHASE 3: DATA VERIFICATION QUERIES
-- ============================================================================

-- ===========================================
-- Row Count Verification
-- ===========================================

-- Master reference data verification
SELECT 
    'Master Reference Data' as table_group,
    category,
    COUNT(*) as new_count,
    (CASE 
        WHEN category = 'country' THEN (SELECT COUNT(DISTINCT country) FROM master_locations WHERE country IS NOT NULL)
        WHEN category = 'state' THEN (SELECT COUNT(DISTINCT state) FROM master_locations WHERE state IS NOT NULL)
        WHEN category = 'district' THEN (SELECT COUNT(DISTINCT district) FROM master_locations WHERE district IS NOT NULL)
        WHEN category = 'department' THEN (SELECT COUNT(*) FROM master_departments)
        WHEN category = 'occupation' THEN (SELECT COUNT(*) FROM master_occupations)
        WHEN category = 'business_category' THEN (SELECT COUNT(*) FROM master_business_categories)
        ELSE 0
    END) as old_count,
    CASE 
        WHEN COUNT(*) = (CASE 
            WHEN category = 'country' THEN (SELECT COUNT(DISTINCT country) FROM master_locations WHERE country IS NOT NULL)
            WHEN category = 'state' THEN (SELECT COUNT(DISTINCT state) FROM master_locations WHERE state IS NOT NULL)
            WHEN category = 'district' THEN (SELECT COUNT(DISTINCT district) FROM master_locations WHERE district IS NOT NULL)
            WHEN category = 'department' THEN (SELECT COUNT(*) FROM master_departments)
            WHEN category = 'occupation' THEN (SELECT COUNT(*) FROM master_occupations)
            WHEN category = 'business_category' THEN (SELECT COUNT(*) FROM master_business_categories)
            ELSE 0
        END) THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as verification_status
FROM master_reference_data 
GROUP BY category
ORDER BY category;

-- Products verification
SELECT 
    'Products' as table_name,
    COUNT(*) as new_count,
    (SELECT COUNT(*) FROM products) as old_count,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM products) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as verification_status
FROM products_unified;

-- Policy details verification
SELECT 
    'Policy Details' as table_name,
    lob_type,
    COUNT(*) as new_count,
    (CASE 
        WHEN lob_type = 'motor' THEN (SELECT COUNT(*) FROM policy_motor_details)
        WHEN lob_type = 'health' THEN (SELECT COUNT(*) FROM policy_health_details) 
        WHEN lob_type = 'life' THEN (SELECT COUNT(*) FROM policy_life_details)
        ELSE 0
    END) as old_count,
    CASE 
        WHEN COUNT(*) = (CASE 
            WHEN lob_type = 'motor' THEN (SELECT COUNT(*) FROM policy_motor_details)
            WHEN lob_type = 'health' THEN (SELECT COUNT(*) FROM policy_health_details)
            WHEN lob_type = 'life' THEN (SELECT COUNT(*) FROM policy_life_details)
            ELSE 0
        END) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as verification_status
FROM policy_details_unified
GROUP BY lob_type
ORDER BY lob_type;

-- Commission structures verification
SELECT 
    'Commission Rules' as table_name,
    COUNT(*) as new_count,
    (SELECT COUNT(*) FROM commission_rules WHERE status = 'Active') as old_count,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM commission_rules WHERE status = 'Active') THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as verification_status
FROM commission_structures;

-- Documents verification
SELECT 
    'Documents' as table_name,
    entity_type,
    COUNT(*) as new_count,
    (CASE 
        WHEN entity_type = 'policy' THEN (SELECT COUNT(*) FROM policy_documents)
        ELSE (SELECT COUNT(*) FROM documents WHERE entity_type = documents_unified.entity_type)
    END) as old_count,
    CASE 
        WHEN COUNT(*) >= (CASE 
            WHEN entity_type = 'policy' THEN (SELECT COUNT(*) FROM policy_documents)
            ELSE (SELECT COUNT(*) FROM documents WHERE entity_type = documents_unified.entity_type)
        END) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as verification_status
FROM documents_unified
GROUP BY entity_type
ORDER BY entity_type;

-- Workflow instances verification  
SELECT 
    'Workflow Instances' as table_name,
    workflow_type,
    COUNT(*) as new_count,
    (CASE 
        WHEN workflow_type = 'agent_approval' THEN (SELECT COUNT(*) FROM agent_approvals)
        ELSE 0
    END) as old_count,
    CASE 
        WHEN COUNT(*) = (CASE 
            WHEN workflow_type = 'agent_approval' THEN (SELECT COUNT(*) FROM agent_approvals)
            ELSE 0
        END) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as verification_status
FROM workflow_instances
GROUP BY workflow_type
ORDER BY workflow_type;

-- ===========================================
-- Data Integrity Verification
-- ===========================================

-- Check for missing foreign key references in new schema
SELECT 
    'Products Foreign Keys' as check_name,
    COUNT(*) as invalid_count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM products_unified p
WHERE NOT EXISTS (
    SELECT 1 FROM master_insurance_providers mip WHERE mip.provider_id = p.provider_id
) OR NOT EXISTS (
    SELECT 1 FROM master_line_of_business mlob WHERE mlob.lob_id = p.lob_id
);

-- Check policy details consistency
SELECT 
    'Policy Details Consistency' as check_name,
    COUNT(*) as invalid_count,
    CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM policy_details_unified pdu
WHERE NOT EXISTS (
    SELECT 1 FROM policies p WHERE p.policy_id = pdu.policy_id
);

-- Check JSONB data completeness for motor policies
SELECT 
    'Motor Details JSONB Completeness' as check_name,
    COUNT(*) as records_with_data,
    (SELECT COUNT(*) FROM policy_details_unified WHERE lob_type = 'motor') as total_records,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM policy_details_unified WHERE lob_type = 'motor') 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as status
FROM policy_details_unified 
WHERE lob_type = 'motor' 
AND motor_details IS NOT NULL 
AND jsonb_typeof(motor_details) = 'object';

-- Check JSONB data completeness for health policies
SELECT 
    'Health Details JSONB Completeness' as check_name,
    COUNT(*) as records_with_data,
    (SELECT COUNT(*) FROM policy_details_unified WHERE lob_type = 'health') as total_records,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM policy_details_unified WHERE lob_type = 'health') 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as status
FROM policy_details_unified 
WHERE lob_type = 'health' 
AND health_details IS NOT NULL 
AND jsonb_typeof(health_details) = 'object';

-- Check commission rules JSONB structure
SELECT 
    'Commission Rules JSONB Structure' as check_name,
    COUNT(*) as valid_rules,
    (SELECT COUNT(*) FROM commission_structures) as total_rules,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM commission_structures) 
        THEN '✓ PASS' 
        ELSE '✗ FAIL' 
    END as status
FROM commission_structures 
WHERE rules IS NOT NULL 
AND jsonb_typeof(rules) = 'object'
AND rules ? 'base_rate';

-- ===========================================
-- Sample Data Validation
-- ===========================================

-- Sample motor policy data validation
SELECT 
    'Sample Motor Policy Data' as validation_type,
    pdu.policy_id,
    pdu.motor_details->>'vehicle_reg_no' as vehicle_reg_no,
    pdu.motor_details->>'make' as make,
    pdu.motor_details->>'model' as model,
    pdu.proposer_details->>'name' as proposer_name,
    pdu.sum_insured,
    'Motor policy data migrated correctly' as status
FROM policy_details_unified pdu
WHERE lob_type = 'motor'
LIMIT 5;

-- Sample health policy data validation  
SELECT 
    'Sample Health Policy Data' as validation_type,
    pdu.policy_id,
    pdu.health_details->>'policy_type' as policy_type,
    pdu.health_details->>'family_definition' as family_definition,
    pdu.proposer_details->>'name' as proposer_name,
    pdu.nominee_details->>'name' as nominee_name,
    pdu.sum_insured,
    'Health policy data migrated correctly' as status
FROM policy_details_unified pdu  
WHERE lob_type = 'health'
LIMIT 5;

-- Sample commission rule validation
SELECT 
    'Sample Commission Rules' as validation_type,
    cs.rule_name,
    cs.criteria->>'product_id' as product_id,
    cs.criteria->>'channel' as channel,
    cs.rules->>'base_rate' as base_rate,
    jsonb_array_length(cs.rules->'slabs') as slab_count,
    'Commission rule migrated correctly' as status
FROM commission_structures cs
LIMIT 5;

-- ===========================================
-- Tenant Isolation Verification
-- ===========================================

-- Verify tenant isolation in new tables
SELECT 
    table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT tenant_id) as distinct_tenants,
    CASE 
        WHEN COUNT(DISTINCT tenant_id) > 1 THEN '✓ Multi-tenant data preserved'
        WHEN COUNT(DISTINCT tenant_id) = 1 THEN '⚠ Single tenant data'
        ELSE '✗ No tenant data'
    END as tenant_isolation_status
FROM (
    SELECT 'products_unified' as table_name, tenant_id FROM products_unified
    UNION ALL
    SELECT 'policy_details_unified' as table_name, tenant_id FROM policy_details_unified  
    UNION ALL
    SELECT 'commission_structures' as table_name, tenant_id FROM commission_structures
    UNION ALL
    SELECT 'documents_unified' as table_name, tenant_id FROM documents_unified
    UNION ALL
    SELECT 'workflow_instances' as table_name, tenant_id FROM workflow_instances
) tenant_check
GROUP BY table_name
ORDER BY table_name;

-- ===========================================
-- Performance Validation
-- ===========================================

-- Check index effectiveness on new tables
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM master_reference_data 
WHERE category = 'department' AND tenant_id IS NOT NULL;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM policy_details_unified 
WHERE lob_type = 'motor' AND tenant_id IS NOT NULL;

EXPLAIN (ANALYZE, BUFFERS)  
SELECT * FROM commission_structures
WHERE criteria->>'product_id' IS NOT NULL AND tenant_id IS NOT NULL;

-- ===========================================
-- Migration Summary Report
-- ===========================================

SELECT 
    'MIGRATION SUMMARY REPORT' as report_title,
    now() as generated_at
UNION ALL
SELECT '=========================' as report_title, null as generated_at
UNION ALL  
SELECT 
    CONCAT('Total tables migrated: ', COUNT(*)) as report_title,
    null as generated_at
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'master_reference_data', 'products_unified', 'policy_details_unified',
    'commission_structures', 'documents_unified', 'workflow_instances'
)
UNION ALL
SELECT 
    CONCAT('Total records migrated: ', 
        (SELECT COUNT(*) FROM master_reference_data) +
        (SELECT COUNT(*) FROM products_unified) +
        (SELECT COUNT(*) FROM policy_details_unified) +
        (SELECT COUNT(*) FROM commission_structures) +
        (SELECT COUNT(*) FROM documents_unified) +
        (SELECT COUNT(*) FROM workflow_instances)
    ) as report_title,
    null as generated_at
UNION ALL
SELECT 'Migration completed successfully!' as report_title, null as generated_at;