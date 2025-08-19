-- Complete the products_unified table creation
DROP TABLE IF EXISTS products_unified CASCADE;

CREATE TABLE products_unified (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_product_id uuid, -- Reference to original products.product_id
    tenant_id text, -- Now supports both uuid (as text) and integer tenant IDs
    name character varying,
    type character varying,
    commission_rule jsonb,
    status character varying DEFAULT 'Active',
    
    -- Enhanced fields for unified structure
    provider_id text, -- Flexible ID type
    lob_id text, -- Flexible ID type
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

-- Now let's verify the schema alignment is complete
SELECT 
    'SCHEMA ALIGNMENT COMPLETED' as status,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('commission_structures', 'workflow_instances', 'master_reference_data', 'products_unified', 'documents_unified')
AND column_name IN ('id', 'entity_id', 'tenant_id')
ORDER BY table_name, column_name;