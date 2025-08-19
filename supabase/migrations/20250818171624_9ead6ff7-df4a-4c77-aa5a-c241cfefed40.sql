-- Documents Unification Migration
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
    
FROM documents d
ON CONFLICT (id) DO NOTHING;

-- Get migration summary
SELECT 
    'DOCUMENTS MIGRATION COMPLETED' as status,
    'documents_unified' as table_name,
    document_category,
    COUNT(*) as migrated_records,
    COUNT(*) FILTER (WHERE verification_status = 'active') as active_records
FROM documents_unified
GROUP BY document_category
ORDER BY document_category;