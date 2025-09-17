-- Test the provider auto-save by manually inserting providers from existing policies
INSERT INTO providers (name, code, is_active, created_at)
SELECT DISTINCT 
  provider as name,
  UPPER(REPLACE(provider, ' ', '_')) as code,
  true as is_active,
  NOW() as created_at
FROM policies 
WHERE provider IS NOT NULL 
  AND provider NOT IN (SELECT COALESCE(name, '') FROM providers)
ON CONFLICT (name) DO NOTHING;