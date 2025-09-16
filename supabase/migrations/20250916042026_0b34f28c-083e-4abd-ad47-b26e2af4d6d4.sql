-- Create a default Bronze tier for organizations if it doesn't exist
INSERT INTO commission_tiers (id, name, description, base_percentage, org_id, is_active)
SELECT 
    gen_random_uuid(),
    'Bronze',
    'Default commission tier for new agents',
    70.0,
    org.id,
    true
FROM organizations org
WHERE NOT EXISTS (
    SELECT 1 FROM commission_tiers ct 
    WHERE ct.org_id = org.id AND LOWER(ct.name) = 'bronze'
);

-- Update agents without commission_tier_id to use Bronze tier
UPDATE agents 
SET commission_tier_id = (
    SELECT ct.id 
    FROM commission_tiers ct 
    WHERE ct.org_id = agents.org_id 
    AND LOWER(ct.name) = 'bronze' 
    LIMIT 1
)
WHERE commission_tier_id IS NULL;