-- Products Unification - migrate products → products_unified
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
LEFT JOIN master_plan_types pt ON p.plan_type_id = pt.plan_type_id
ON CONFLICT (id) DO NOTHING;