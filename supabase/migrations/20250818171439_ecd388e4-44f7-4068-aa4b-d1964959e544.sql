-- Continue Master Reference Data Consolidation with proper type casting

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
FROM master_departments
ON CONFLICT (category, code, tenant_id) DO NOTHING;

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
    NULL::uuid as tenant_id, -- Global reference
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_occupations
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Migrate master_business_categories → master_reference_data
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
    NULL::uuid as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_business_categories
ON CONFLICT (category, code, tenant_id) DO NOTHING;