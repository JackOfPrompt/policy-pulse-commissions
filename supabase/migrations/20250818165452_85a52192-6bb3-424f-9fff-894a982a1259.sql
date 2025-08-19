-- Step 8: Migrate Insurance Providers to master_reference_data
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'insurance_provider' as category,
    COALESCE(provider_code, 'PROV_' || provider_id::text) as code,
    provider_name as name,
    jsonb_build_object(
        'type', 'insurance_provider',
        'license_number', license_number,
        'phone', phone,
        'email', email,
        'website', website,
        'address', address,
        'city', city,
        'state', state,
        'pincode', pincode,
        'registration_date', registration_date,
        'irdai_code', irdai_code,
        'gstin', gstin,
        'contact_person', contact_person,
        'contact_designation', contact_designation,
        'original_id', provider_id
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN COALESCE(status, 'Active') = 'Active' THEN true ELSE false END as is_active,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM master_insurance_providers
WHERE provider_name IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Step 9: Migrate Lines of Business
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)  
SELECT 
    'line_of_business' as category,
    COALESCE(lob_code, 'LOB_' || lob_id::text) as code,
    lob_name as name,
    jsonb_build_object(
        'type', 'line_of_business',
        'description', COALESCE(description, ''),
        'irdai_code', irdai_code,
        'category', category,
        'sub_category', sub_category,
        'original_id', lob_id
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN COALESCE(status, 'Active') = 'Active' THEN true ELSE false END as is_active,
    created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM master_line_of_business
WHERE lob_name IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Final Migration Summary
SELECT 
    'MIGRATION COMPLETED' as status,
    'master_reference_data' as table_name,
    category,
    COUNT(*) as migrated_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM master_reference_data
GROUP BY category
ORDER BY category;