-- Add unique constraint on provider name within org
ALTER TABLE providers ADD CONSTRAINT providers_name_org_unique UNIQUE (name, org_id);

-- Update the trigger function to include org_id
CREATE OR REPLACE FUNCTION public.auto_save_provider_from_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-save provider if it doesn't exist and provider field is not null
  IF NEW.provider IS NOT NULL AND NEW.org_id IS NOT NULL THEN
    -- Check if provider already exists for this org (case-insensitive)
    IF NOT EXISTS (
      SELECT 1 FROM providers 
      WHERE LOWER(name) = LOWER(NEW.provider) AND org_id = NEW.org_id
    ) THEN
      -- Insert new provider with org_id
      INSERT INTO providers (name, code, is_active, org_id, created_at)
      VALUES (
        NEW.provider,
        UPPER(REPLACE(NEW.provider, ' ', '_')), -- Generate code from name
        true,
        NEW.org_id,
        NOW()
      )
      ON CONFLICT (name, org_id) DO NOTHING; -- Prevent duplicates
    END IF;
    
    -- Update the provider_id in the policy if it's null
    IF NEW.provider_id IS NULL THEN
      SELECT id INTO NEW.provider_id 
      FROM providers 
      WHERE LOWER(name) = LOWER(NEW.provider) AND org_id = NEW.org_id
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Insert existing providers from policies with their org_id
INSERT INTO providers (name, code, is_active, org_id, created_at)
SELECT DISTINCT 
  p.provider as name,
  UPPER(REPLACE(p.provider, ' ', '_')) as code,
  true as is_active,
  p.org_id,
  NOW() as created_at
FROM policies p
WHERE p.provider IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM providers pr 
    WHERE pr.name = p.provider AND pr.org_id = p.org_id
  )
ON CONFLICT (name, org_id) DO NOTHING;