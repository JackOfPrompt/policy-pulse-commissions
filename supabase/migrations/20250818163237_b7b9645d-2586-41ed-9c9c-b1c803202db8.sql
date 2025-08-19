-- Quick test to show current data status
SELECT 
    'New Tables Status' as status_check,
    'master_reference_data' as table_name,
    COUNT(*) as record_count
FROM master_reference_data
UNION ALL
SELECT 'New Tables Status', 'products_unified', COUNT(*) FROM products_unified  
UNION ALL
SELECT 'New Tables Status', 'policy_details_unified', COUNT(*) FROM policy_details_unified
UNION ALL
SELECT 'New Tables Status', 'commission_structures', COUNT(*) FROM commission_structures
UNION ALL
SELECT 'New Tables Status', 'documents_unified', COUNT(*) FROM documents_unified
UNION ALL
SELECT 'New Tables Status', 'workflow_instances', COUNT(*) FROM workflow_instances
UNION ALL
SELECT 'Source Tables Status', 'master_locations (sample)', COUNT(*) FROM master_locations
UNION ALL
SELECT 'Source Tables Status', 'products (sample)', COUNT(*) FROM products
UNION ALL
SELECT 'Source Tables Status', 'policy_motor_details (sample)', COUNT(*) FROM policy_motor_details
ORDER BY status_check, table_name;