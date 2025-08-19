-- Schema Alignment: Update unified tables to accommodate existing ID formats

-- 1. Update commission_structures to accept bigint IDs
ALTER TABLE commission_structures 
ALTER COLUMN id TYPE text USING id::text;

-- Add legacy_id column for direct mapping
ALTER TABLE commission_structures 
ADD COLUMN IF NOT EXISTS legacy_rule_id bigint;

-- 2. Update workflow_instances to accept bigint entity IDs  
ALTER TABLE workflow_instances
ALTER COLUMN entity_id TYPE text USING entity_id::text;

-- Add legacy entity ID column
ALTER TABLE workflow_instances
ADD COLUMN IF NOT EXISTS legacy_entity_id bigint;

-- 3. Update master_reference_data to accept integer tenant IDs
ALTER TABLE master_reference_data
ALTER COLUMN tenant_id TYPE text USING tenant_id::text;

-- Add legacy tenant ID column
ALTER TABLE master_reference_data
ADD COLUMN IF NOT EXISTS legacy_tenant_id integer;

-- 4. Simplify products_unified to match actual products table structure
DROP TABLE IF EXISTS products_unified CASCADE;

CREATE TABLE products_unified (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_product_id uuid, -- Reference to original products.product_id
    tenant_id uuid,
    name character varying,
    type character varying,
    commission_rule jsonb,
    status character varying DEFAULT 'Active',
    
    -- Enhanced fields for unified structure
    provider_id uuid,
    lob_id uuid,
    product_config jsonb DEFAULT '{}',
    pricing_config jsonb DEFAULT '{}',
    eligibility_config jsonb DEFAULT '{}',
    coverage_config jsonb DEFAULT '{}',
    
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- Enable RLS on products_unified
ALTER TABLE products_unified ENABLE ROW LEVEL SECURITY;

-- Create policies for products_unified
CREATE POLICY "Authenticated users can view unified products" 
ON products_unified FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System admins can manage unified products" 
ON products_unified FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'::app_role
));

-- 5. Update documents_unified tenant_id type
ALTER TABLE documents_unified
ALTER COLUMN tenant_id TYPE text USING tenant_id::text;