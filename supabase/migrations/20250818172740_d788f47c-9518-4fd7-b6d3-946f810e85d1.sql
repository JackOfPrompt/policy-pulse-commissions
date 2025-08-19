-- Drop Old Schema Tables After Migration Completion

-- Drop old master data tables (migrated to master_reference_data)
DROP TABLE IF EXISTS master_locations CASCADE;
DROP TABLE IF EXISTS master_departments CASCADE; 
DROP TABLE IF EXISTS master_occupations CASCADE;

-- Drop old products table (migrated to products_unified)
DROP TABLE IF EXISTS products CASCADE;

-- Drop old commission tables (migrated to commission_structures)
DROP TABLE IF EXISTS commission_slabs CASCADE;
DROP TABLE IF EXISTS commission_rules CASCADE;

-- Drop old workflow tables (migrated to workflow_instances)
DROP TABLE IF EXISTS agent_approvals CASCADE;

-- Drop old document tables (migrated to documents_unified)
DROP TABLE IF EXISTS policy_documents CASCADE;

-- Drop old commission detail tables (now part of commission_structures)
DROP TABLE IF EXISTS commission_flat CASCADE;
DROP TABLE IF EXISTS commission_renewal CASCADE;
DROP TABLE IF EXISTS commission_business_bonus CASCADE;
DROP TABLE IF EXISTS commission_tiers CASCADE;
DROP TABLE IF EXISTS commission_time_bonus CASCADE;

-- Verification: Show remaining tables
SELECT 
    'OLD_SCHEMA_CLEANUP_COMPLETED' as status,
    'Remaining tables after cleanup:' as message;

SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;