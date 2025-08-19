-- Verification Migration: Drop Remaining Duplicate and Legacy Tables

-- Drop remaining old policy detail tables (migrated to policy_details_unified)
DROP TABLE IF EXISTS policy_health_details CASCADE;
DROP TABLE IF EXISTS policy_life_details CASCADE;
DROP TABLE IF EXISTS policy_motor_details CASCADE;

-- Drop old documents table (we now have documents_unified)
DROP TABLE IF EXISTS documents CASCADE;

-- Drop any remaining legacy commission tables
DROP TABLE IF EXISTS commission_audit_log CASCADE;
DROP TABLE IF EXISTS commission_earnings CASCADE;
DROP TABLE IF EXISTS commission_overrides CASCADE;

-- Drop legacy tenant-specific tables (if they exist and are duplicates)
DROP TABLE IF EXISTS tenant_commission_history CASCADE;
DROP TABLE IF EXISTS tenant_commission_rules CASCADE;
DROP TABLE IF EXISTS tenant_commission_slabs CASCADE;

-- Drop old user management tables if they're duplicates
DROP TABLE IF EXISTS user_credentials CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any remaining legacy settlement tables
DROP TABLE IF EXISTS settlement_links CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS variances CASCADE;

-- Drop legacy policy tables that might be duplicates
DROP TABLE IF EXISTS policy_map CASCADE;
DROP TABLE IF EXISTS policy_commissions CASCADE;

-- Verification: Show final table count and structure
SELECT 
    'DUPLICATE_CLEANUP_COMPLETED' as status,
    COUNT(*) as total_tables,
    'Final table structure after cleanup' as message
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%';

-- List all remaining tables for verification
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename LIKE '%_unified' THEN 'NEW_UNIFIED'
        WHEN tablename LIKE 'master_%' THEN 'MASTER_DATA'
        WHEN tablename LIKE 'fact_%' THEN 'ANALYTICS'
        WHEN tablename LIKE 'finance_%' THEN 'FINANCE'
        WHEN tablename IN ('profiles', 'tenants', 'branches', 'agents') THEN 'CORE_ENTITIES'
        WHEN tablename LIKE 'workflow_%' THEN 'WORKFLOW'
        ELSE 'OTHER'
    END as table_category
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
ORDER BY table_category, tablename;