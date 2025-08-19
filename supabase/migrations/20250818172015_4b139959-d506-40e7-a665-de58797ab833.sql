-- Schema Alignment: Drop policies, update schemas, recreate policies

-- 1. Drop existing policies that depend on column types we need to change
DROP POLICY IF EXISTS "tenant_isolation_master_reference" ON master_reference_data;
DROP POLICY IF EXISTS "tenant_isolation_commission" ON commission_structures;
DROP POLICY IF EXISTS "tenant_isolation_documents" ON documents_unified;

-- 2. Update commission_structures schema
ALTER TABLE commission_structures 
ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE commission_structures 
ADD COLUMN IF NOT EXISTS legacy_rule_id bigint;

-- 3. Update workflow_instances schema
ALTER TABLE workflow_instances
ALTER COLUMN entity_id TYPE text USING entity_id::text;

ALTER TABLE workflow_instances
ADD COLUMN IF NOT EXISTS legacy_entity_id bigint;

-- 4. Update master_reference_data schema
ALTER TABLE master_reference_data
ALTER COLUMN tenant_id TYPE text USING tenant_id::text;

ALTER TABLE master_reference_data
ADD COLUMN IF NOT EXISTS legacy_tenant_id integer;

-- 5. Update documents_unified schema
ALTER TABLE documents_unified
ALTER COLUMN tenant_id TYPE text USING tenant_id::text;

-- 6. Recreate RLS policies with text-based tenant_id
CREATE POLICY "tenant_isolation_master_reference" 
ON master_reference_data FOR ALL 
USING (
  tenant_id IS NULL OR 
  tenant_id = (current_setting('app.tenant_id', true))
);

CREATE POLICY "tenant_isolation_commission" 
ON commission_structures FOR ALL 
USING (
  tenant_id::text = (current_setting('app.tenant_id', true))
);

CREATE POLICY "tenant_isolation_documents" 
ON documents_unified FOR ALL 
USING (
  tenant_id::text = (current_setting('app.tenant_id', true))
);