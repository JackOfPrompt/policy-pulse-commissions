-- Create function to auto-save providers when policies are created
CREATE OR REPLACE FUNCTION public.auto_save_provider_from_policy()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-save provider if it doesn't exist and provider field is not null
  IF NEW.provider IS NOT NULL THEN
    -- Check if provider already exists (case-insensitive)
    IF NOT EXISTS (
      SELECT 1 FROM providers 
      WHERE LOWER(name) = LOWER(NEW.provider) 
         OR LOWER(code) = LOWER(NEW.provider)
    ) THEN
      -- Insert new provider
      INSERT INTO providers (name, code, is_active, created_at)
      VALUES (
        NEW.provider,
        UPPER(REPLACE(NEW.provider, ' ', '_')), -- Generate code from name
        true,
        NOW()
      )
      ON CONFLICT DO NOTHING; -- Prevent duplicates in case of race conditions
    END IF;
    
    -- Update the provider_id in the policy if it's null
    IF NEW.provider_id IS NULL THEN
      SELECT id INTO NEW.provider_id 
      FROM providers 
      WHERE LOWER(name) = LOWER(NEW.provider) 
         OR LOWER(code) = LOWER(NEW.provider)
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for policies table to auto-save providers
CREATE TRIGGER auto_save_provider_from_policy_trigger
  BEFORE INSERT OR UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_save_provider_from_policy();