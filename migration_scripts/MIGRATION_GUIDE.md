# Insurance Platform Schema Migration Guide

## Overview
This guide provides step-by-step instructions to migrate your existing insurance platform from a 93-table schema to an optimized 35-table structure. The migration consolidates master tables, unifies LOB-specific policy details, and implements JSONB-based flexibility while maintaining tenant isolation and data integrity.

## Migration Strategy

### Phase 1: New Schema Creation ✅
- Create optimized table structure
- Implement JSONB-based consolidation
- Set up tenant-aware RLS policies
- **Status**: Completed

### Phase 2: Data Transformation
- Master reference data consolidation
- Products unification
- Policy details unification (Motor/Health/Life → Unified)
- Commission structures consolidation
- Documents unification
- Workflow instances creation

### Phase 3: Validation & Verification
- Row count verification
- Data integrity checks
- JSONB structure validation
- Tenant isolation verification
- Performance validation

### Phase 4: Cleanup & Rollback Preparation
- Original table archival
- Rollback script preparation
- Final validation

## Pre-Migration Checklist

### 1. Environment Preparation
- [ ] **Backup Database**: Create full database backup
- [ ] **Test Environment**: Set up identical test environment
- [ ] **Downtime Window**: Schedule maintenance window
- [ ] **Access Control**: Ensure proper database permissions
- [ ] **Monitoring**: Set up migration monitoring

### 2. Dependency Analysis
- [ ] **Application Dependencies**: Identify apps using current schema
- [ ] **API Endpoints**: List all endpoints that need updates
- [ ] **Stored Procedures**: Document procedures using old tables
- [ ] **Views**: Identify views that reference old tables
- [ ] **Reports**: List reports that need schema updates

### 3. Data Validation
- [ ] **Data Quality**: Run data quality checks on source tables
- [ ] **Referential Integrity**: Verify foreign key relationships
- [ ] **Orphaned Records**: Identify and handle orphaned data
- [ ] **Data Completeness**: Ensure all required fields are populated

## Step-by-Step Migration Process

### Step 1: Create New Schema Structure
```sql
-- Execute Phase 1 script (already completed)
-- This creates all the new optimized tables with proper RLS policies
```

### Step 2: Execute Data Transformation
```bash
# Connect to your database and run the transformation script
psql -h your-host -U your-user -d your-database -f migration_scripts/phase2_data_transformation.sql
```

**Key Transformations:**
- **Master Data**: All location, department, occupation data → `master_reference_data`
- **Products**: Product details with JSONB config → `products_unified`
- **Motor Policies**: `policy_motor_details` → `policy_details_unified.motor_details`
- **Health Policies**: `policy_health_details` → `policy_details_unified.health_details`
- **Life Policies**: `policy_life_details` → `policy_details_unified.life_details`
- **Commission Rules**: Multiple commission tables → `commission_structures.rules`
- **Documents**: All document tables → `documents_unified`
- **Workflows**: Agent approvals → `workflow_instances`

### Step 3: Data Verification
```bash
# Run comprehensive verification queries
psql -h your-host -U your-user -d your-database -f migration_scripts/phase3_verification_queries.sql
```

**Verification Includes:**
- Row count comparisons (old vs new)
- Data integrity checks
- JSONB structure validation
- Tenant isolation verification
- Sample data validation
- Performance checks

### Step 4: Application Updates
After successful data migration, update your applications:

#### 4.1 Update Database Models
```javascript
// Example: Update your Supabase types
// Old structure
const motorPolicy = await supabase
  .from('policy_motor_details')
  .select('vehicle_reg_no, make, model');

// New unified structure
const motorPolicy = await supabase
  .from('policy_details_unified')
  .select('motor_details')
  .eq('lob_type', 'motor');
```

#### 4.2 Update API Endpoints
```javascript
// Example: Commission rules API
// Old: Multiple queries across commission_rules, commission_slabs, etc.
// New: Single query with JSONB structure
const commissionRule = await supabase
  .from('commission_structures')
  .select('rules')
  .eq('id', ruleId);

// Extract specific rule components
const baseRate = commissionRule.rules.base_rate;
const slabs = commissionRule.rules.slabs;
```

#### 4.3 Update Forms and UI
- Update policy creation forms to use unified structure
- Modify policy display components to read from JSONB fields
- Update commission rule builders to work with new structure

### Step 5: Testing and Validation
1. **Unit Tests**: Update and run all unit tests
2. **Integration Tests**: Verify API endpoints work correctly
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Ensure queries perform well with new structure
5. **User Acceptance Testing**: Validate with key users

### Step 6: Go-Live
1. **Final Backup**: Create final backup before go-live
2. **Deploy Updated Application**: Deploy application with new schema support
3. **Monitor**: Monitor application performance and errors
4. **Validate**: Run production validation checks

### Step 7: Cleanup (Post Go-Live)
After confirming everything works correctly:
```sql
-- Archive old tables (recommended: keep for 30 days)
-- Then drop old tables
DROP TABLE policy_motor_details;
DROP TABLE policy_health_details;
DROP TABLE policy_life_details;
-- ... (continue for all migrated tables)
```

## Rollback Procedure

If issues are encountered, execute the rollback:
```bash
# Execute rollback script to restore original schema
psql -h your-host -U your-user -d your-database -f migration_scripts/phase4_rollback_scripts.sql
```

**Rollback Process:**
1. Backup new tables (with timestamp suffix)
2. Drop new unified tables and policies
3. Restore original table structure
4. Restore original RLS policies
5. Restore original indexes
6. Verify rollback success

## Key Benefits After Migration

### 1. Reduced Complexity
- **93 → 35 tables**: Simplified schema management
- **Unified LOB handling**: Single table for all policy types
- **Consolidated master data**: Hierarchical reference data structure

### 2. Enhanced Flexibility
- **JSONB storage**: Easy schema evolution without migrations
- **Dynamic configurations**: Product configs stored as flexible JSON
- **Extensible structures**: Easy to add new policy types or fields

### 3. Improved Performance
- **Fewer joins**: Reduced complex multi-table queries
- **Optimized indexes**: Strategic indexing on JSONB fields
- **Tenant isolation**: Efficient RLS policies

### 4. Better Maintainability
- **Consistent patterns**: Unified approach across all data types
- **Reduced code duplication**: Single code path for policy handling
- **Easier testing**: Fewer table dependencies

## JSONB Query Examples

### Motor Policy Details
```sql
-- Get vehicle information
SELECT 
  policy_id,
  motor_details->>'vehicle_reg_no' as reg_no,
  motor_details->>'make' as make,
  motor_details->>'model' as model
FROM policy_details_unified 
WHERE lob_type = 'motor';

-- Filter by vehicle type
SELECT * FROM policy_details_unified 
WHERE lob_type = 'motor' 
AND motor_details->>'vehicle_type' = 'Car';
```

### Commission Rules
```sql
-- Get base rate and slabs
SELECT 
  rule_name,
  rules->>'base_rate' as base_rate,
  jsonb_array_length(rules->'slabs') as slab_count
FROM commission_structures;

-- Filter by slab criteria
SELECT * FROM commission_structures
WHERE rules->'slabs' @> '[{"slab_type": "Premium"}]';
```

### Master Reference Data
```sql
-- Get hierarchical location data
WITH RECURSIVE location_hierarchy AS (
  SELECT id, name, parent_id, category, 1 as level
  FROM master_reference_data 
  WHERE category = 'country' AND parent_id IS NULL
  
  UNION ALL
  
  SELECT mrd.id, mrd.name, mrd.parent_id, mrd.category, lh.level + 1
  FROM master_reference_data mrd
  JOIN location_hierarchy lh ON mrd.parent_id = lh.id
)
SELECT * FROM location_hierarchy ORDER BY level, name;
```

## Performance Optimization

### Recommended Indexes
```sql
-- JSONB field indexes for common queries
CREATE INDEX idx_policy_details_motor_vehicle_type 
ON policy_details_unified USING GIN ((motor_details->>'vehicle_type'));

CREATE INDEX idx_policy_details_health_policy_type 
ON policy_details_unified USING GIN ((health_details->>'policy_type'));

CREATE INDEX idx_commission_product_criteria 
ON commission_structures USING GIN ((criteria->>'product_id'));

-- Multi-column indexes for common filter combinations
CREATE INDEX idx_policy_details_lob_tenant 
ON policy_details_unified (lob_type, tenant_id);
```

## Troubleshooting

### Common Issues and Solutions

1. **Missing Data After Migration**
   - Run verification queries to identify missing records
   - Check for NULL values in source data
   - Verify foreign key relationships

2. **JSONB Query Performance**
   - Add appropriate GIN indexes on JSONB fields
   - Use specific field extraction instead of full JSONB scans
   - Consider materialized views for complex JSONB queries

3. **RLS Policy Issues**
   - Verify tenant_id is properly set in application context
   - Check policy conditions match your access patterns
   - Test policies with different user roles

4. **Application Errors After Migration**
   - Update all database queries to use new table structure
   - Handle JSONB null values gracefully
   - Update form validations for new field structures

### Support and Documentation
- Keep this migration guide updated with any changes
- Document any custom modifications made during migration
- Create operational runbooks for the new schema
- Train team members on JSONB query patterns

## Conclusion
This migration transforms your insurance platform into a more maintainable, scalable, and flexible system while preserving all existing functionality and data integrity. The unified schema with JSONB flexibility positions your platform for future growth and easier maintenance.