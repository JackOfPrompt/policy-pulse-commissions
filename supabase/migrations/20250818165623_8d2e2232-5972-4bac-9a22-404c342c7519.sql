-- Step 8: Migrate Insurance Providers to master_reference_data
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)
SELECT 
    'insurance_provider' as category,
    provider_code as code,
    provider_name as name,
    jsonb_build_object(
        'type', 'insurance_provider',
        'trade_name', trade_name,
        'provider_type', provider_type::text,
        'parent_provider_id', parent_provider_id,
        'irda_license_number', irda_license_number,
        'irda_license_valid_till', irda_license_valid_till,
        'logo_file_path', logo_file_path,
        'contact_person', contact_person,
        'contact_email', contact_email,
        'contact_phone', contact_phone,
        'address_line1', address_line1,
        'address_line2', address_line2,
        'state', state,
        'website_url', website_url,
        'notes', notes,
        'original_id', provider_id
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN status::text = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
FROM master_insurance_providers
WHERE provider_name IS NOT NULL
ON CONFLICT (category, code, tenant_id) DO NOTHING;

-- Step 9: Migrate Lines of Business
INSERT INTO master_reference_data (category, code, name, metadata, tenant_id, is_active, created_at, updated_at)  
SELECT 
    'line_of_business' as category,
    lob_code as code,
    lob_name as name,
    jsonb_build_object(
        'type', 'line_of_business',
        'description', COALESCE(description, ''),
        'icon_file_path', icon_file_path,
        'original_id', lob_id,
        'created_by', created_by,
        'updated_by', updated_by
    ) as metadata,
    NULL::uuid as tenant_id,
    CASE WHEN status::text = 'Active' THEN true ELSE false END as is_active,
    created_at,
    updated_at
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