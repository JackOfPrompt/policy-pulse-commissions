-- Update the policy_commission_distribution_view to properly fetch commission rates from grids
DROP VIEW IF EXISTS policy_commission_distribution_view;

CREATE OR REPLACE VIEW policy_commission_distribution_view AS
WITH base AS (
    SELECT
        p.id as policy_id,
        p.policy_number,
        pt.name as product_type,  -- Using product_types.name instead of category
        pt.category as product_category,
        p.provider,
        p.provider_id,
        CONCAT_WS(' ', c.first_name, c.last_name) as customer_name,
        COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) as premium_amount,
        p.source_type,
        p.agent_id,
        p.misp_id,
        p.employee_id,
        p.org_id,
        COALESCE(p.issue_date, p.start_date, CURRENT_DATE) as match_date
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE p.policy_status = 'active'
),
grid_match AS (
    -- Life insurance grid matching
    SELECT 
        b.*,
        lpg.commission_rate,
        COALESCE(lpg.reward_rate, 0) as reward_rate,
        'life_payout_grid' as grid_source,
        lpg.id as grid_id
    FROM base b
    JOIN life_payout_grid lpg ON (
        lpg.org_id = b.org_id 
        AND lpg.product_type = b.product_type
        AND (
            (lpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND lpg.provider_id = b.provider_id)
            OR (lpg.provider_id IS NULL AND LOWER(lpg.provider) = LOWER(COALESCE(b.provider, '')))
        )
        AND (
            (lpg.premium_start_price IS NULL AND lpg.premium_end_price IS NULL)
            OR (b.premium_amount BETWEEN COALESCE(lpg.premium_start_price, 0) AND COALESCE(lpg.premium_end_price, 999999999))
        )
        AND lpg.is_active = true
        AND b.match_date BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, b.match_date)
    )
    WHERE LOWER(b.product_type) = 'life'

    UNION ALL

    -- Health insurance grid matching
    SELECT 
        b.*,
        hpg.commission_rate,
        COALESCE(hpg.reward_rate, 0) as reward_rate,
        'health_payout_grid' as grid_source,
        hpg.id as grid_id
    FROM base b
    JOIN health_payout_grid hpg ON (
        hpg.org_id = b.org_id 
        AND hpg.product_type = b.product_type
        AND (
            (hpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND hpg.provider_id = b.provider_id)
            OR (hpg.provider_id IS NULL AND LOWER(hpg.provider) = LOWER(COALESCE(b.provider, '')))
        )
        AND hpg.is_active = true
        AND b.match_date BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, b.match_date)
    )
    WHERE LOWER(b.product_type) = 'health'

    UNION ALL

    -- Motor insurance grid matching
    SELECT 
        b.*,
        mpg.commission_rate,
        COALESCE(mpg.reward_rate, 0) as reward_rate,
        'motor_payout_grid' as grid_source,
        mpg.id as grid_id
    FROM base b
    JOIN motor_payout_grid mpg ON (
        mpg.org_id = b.org_id 
        AND mpg.product_type = b.product_type
        AND (
            (mpg.provider_id IS NOT NULL AND b.provider_id IS NOT NULL AND mpg.provider_id = b.provider_id)
            OR (mpg.provider_id IS NULL AND LOWER(mpg.provider) = LOWER(COALESCE(b.provider, '')))
        )
        AND mpg.is_active = true
        AND b.match_date BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, b.match_date)
    )
    WHERE LOWER(b.product_type) = 'motor'

    UNION ALL

    -- Fallback for policies without grid matches
    SELECT 
        b.*,
        0 as commission_rate,
        0 as reward_rate,
        'no_match' as grid_source,
        NULL::uuid as grid_id
    FROM base b
    WHERE NOT EXISTS (
        SELECT 1 FROM life_payout_grid lpg 
        WHERE lpg.org_id = b.org_id AND lpg.product_type = b.product_type AND LOWER(b.product_type) = 'life'
    )
    AND NOT EXISTS (
        SELECT 1 FROM health_payout_grid hpg 
        WHERE hpg.org_id = b.org_id AND hpg.product_type = b.product_type AND LOWER(b.product_type) = 'health'
    )
    AND NOT EXISTS (
        SELECT 1 FROM motor_payout_grid mpg 
        WHERE mpg.org_id = b.org_id AND mpg.product_type = b.product_type AND LOWER(b.product_type) = 'motor'
    )
),
commission_calc AS (
    SELECT 
        g.*,
        (g.premium_amount * g.commission_rate / 100) as insurer_commission_amount,
        CASE 
            WHEN g.agent_id IS NOT NULL THEN 'agent'
            WHEN g.misp_id IS NOT NULL THEN 'misp'
            WHEN g.employee_id IS NOT NULL THEN 'employee'
            ELSE 'direct'
        END as actual_source_type
    FROM grid_match g
),
final_calc AS (
    SELECT 
        cc.*,
        a.agent_name,
        a.percentage as agent_percentage,
        m.channel_partner_name as misp_name,
        m.percentage as misp_percentage,
        e.name as employee_name,
        oc.employee_share_percentage,
        -- Calculate distribution amounts
        CASE WHEN cc.actual_source_type = 'agent' 
             THEN (cc.insurer_commission_amount * COALESCE(a.percentage, 0) / 100)
             ELSE 0 END as agent_commission_amount,
        CASE WHEN cc.actual_source_type = 'misp' 
             THEN (cc.insurer_commission_amount * COALESCE(m.percentage, 50) / 100)
             ELSE 0 END as misp_commission_amount,
        CASE WHEN cc.actual_source_type = 'employee' 
             THEN (cc.insurer_commission_amount * COALESCE(oc.employee_share_percentage, 60) / 100)
             ELSE 0 END as employee_commission_amount
    FROM commission_calc cc
    LEFT JOIN agents a ON a.id = cc.agent_id
    LEFT JOIN misps m ON m.id = cc.misp_id
    LEFT JOIN employees e ON e.id = cc.employee_id
    LEFT JOIN org_config oc ON oc.org_id = cc.org_id
)
SELECT 
    fc.policy_id,
    fc.policy_number,
    fc.product_type,
    fc.provider,
    fc.customer_name,
    fc.premium_amount,
    fc.commission_rate,
    fc.insurer_commission_amount,
    fc.agent_commission_amount,
    fc.misp_commission_amount,
    fc.employee_commission_amount,
    (fc.insurer_commission_amount - fc.agent_commission_amount - fc.misp_commission_amount - fc.employee_commission_amount) as broker_share_amount,
    fc.actual_source_type as source_type,
    CASE 
        WHEN fc.actual_source_type = 'agent' THEN COALESCE(fc.agent_name, 'Unknown Agent')
        WHEN fc.actual_source_type = 'misp' THEN COALESCE(fc.misp_name, 'Unknown MISP')
        WHEN fc.actual_source_type = 'employee' THEN COALESCE(fc.employee_name, 'Unknown Employee')
        ELSE 'Direct'
    END as source_name,
    fc.grid_source,
    CASE 
        WHEN fc.grid_source = 'no_match' THEN 'no_grid_match'
        WHEN fc.commission_rate > 0 THEN 'calculated'
        ELSE 'pending'
    END as commission_status,
    NOW() as calc_date
FROM final_calc fc
ORDER BY fc.policy_number;