-- Commission Structures Consolidation
INSERT INTO commission_structures (
    id, tenant_id, rule_name, rule_type, criteria, rules,
    valid_from, valid_to, approval_status, approved_by, approved_at,
    created_by, updated_by, created_at, updated_at
)
SELECT 
    cr.rule_id::uuid as id,
    cr.tenant_id,
    CONCAT('Base Rate - ', COALESCE(p.name, 'Product'), ' - ', cr.channel) as rule_name,
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
LEFT JOIN products p ON cr.product_id = p.product_id
WHERE cr.status = 'Active'
ON CONFLICT (id) DO NOTHING;