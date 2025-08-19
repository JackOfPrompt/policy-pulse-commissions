-- Step 7: Check and migrate Products
-- First check what data exists
SELECT 
    'Source Tables Status' as status_type,
    table_name,
    record_count
FROM (
    SELECT 'products' as table_name, COUNT(*) as record_count FROM products
    UNION ALL
    SELECT 'policy_motor_details', COUNT(*) FROM policy_motor_details
    UNION ALL  
    SELECT 'policy_health_details', COUNT(*) FROM policy_health_details
    UNION ALL
    SELECT 'policy_life_details', COUNT(*) FROM policy_life_details
    UNION ALL
    SELECT 'commission_rules', COUNT(*) FROM commission_rules
    UNION ALL
    SELECT 'policy_documents', COUNT(*) FROM policy_documents
    UNION ALL
    SELECT 'documents', COUNT(*) FROM documents
    UNION ALL
    SELECT 'agent_approvals', COUNT(*) FROM agent_approvals
) source_counts
WHERE record_count > 0
ORDER BY record_count DESC;