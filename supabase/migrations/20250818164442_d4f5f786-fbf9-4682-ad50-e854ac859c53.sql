-- Step 4: Migrate Departments (corrected)
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'department' as category,
    department_code as code,
    department_name as name,
    jsonb_build_object(
        'type', 'department',
        'description', COALESCE(description, ''),
        'branch_id', branch_id,
        'original_id', department_id
    ) as metadata,
    CASE 
        WHEN tenant_id = 0 OR tenant_id IS NULL THEN NULL::uuid
        ELSE tenant_id::text::uuid 
    END as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM master_departments
WHERE department_code IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Step 5: Migrate Occupations (corrected column names)
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'occupation' as category,
    code as code,  -- Using 'code' column instead of 'occupation_code'
    name as name,  -- Using 'name' column instead of 'occupation_name'
    jsonb_build_object(
        'type', 'occupation',
        'description', COALESCE(description, ''),
        'original_id', occupation_id
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM master_occupations
WHERE code IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Step 6: Migrate Business Categories (already correct)
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'business_category' as category,
    category_code as code,
    category_name as name,
    jsonb_build_object(
        'type', 'business_category',
        'description', COALESCE(description, ''),
        'original_id', category_id
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN status = 'Active' THEN true ELSE false END as is_active,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM master_business_categories
WHERE category_code IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Final progress check for master data migration
SELECT 
    category,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count,
    COUNT(DISTINCT tenant_id) FILTER (WHERE tenant_id IS NOT NULL) as tenant_count
FROM master_reference_data 
GROUP BY category 
ORDER BY category;