-- Continue with Products and Commission Migrations

-- Migrate products → products_unified (simplified based on actual structure)
INSERT INTO products_unified (
    legacy_product_id, tenant_id, name, type, commission_rule, status,
    is_active, created_at, updated_at
)
SELECT 
    product_id as legacy_product_id,
    tenant_id::text as tenant_id,
    name,
    type,
    commission_rule,
    status,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM products
ON CONFLICT (id) DO NOTHING;

-- Migrate commission_rules → commission_structures
INSERT INTO commission_structures (
    id, tenant_id, rule_name, rule_type, criteria, rules,
    valid_from, valid_to, approval_status, approved_by, approved_at,
    created_by, updated_by, created_at, updated_at, legacy_rule_id
)
SELECT 
    gen_random_uuid()::text as id, -- Generate new text UUID
    tenant_id::text as tenant_id,
    CONCAT('Base Rate - ', channel, ' - Rule ', rule_id) as rule_name,
    'base' as rule_type,
    
    -- Criteria JSONB
    jsonb_build_object(
        'product_id', product_id,
        'insurer_id', insurer_id,
        'lob_id', lob_id,
        'channel', channel,
        'policy_year', policy_year
    ) as criteria,
    
    -- Rules JSONB containing base rate
    jsonb_build_object(
        'base_rate', base_rate,
        'slabs', '[]'::jsonb,
        'flat_amounts', '[]'::jsonb
    ) as rules,
    
    valid_from,
    valid_to,
    status as approval_status,
    created_by as approved_by,
    created_at as approved_at,
    created_by,
    updated_by,
    created_at,
    updated_at,
    rule_id as legacy_rule_id
    
FROM commission_rules cr
WHERE status = 'Active';