-- Add base_percentage column to agents table
ALTER TABLE public.agents 
ADD COLUMN base_percentage numeric DEFAULT NULL;

-- Create function to update agent base_percentage from commission tier
CREATE OR REPLACE FUNCTION public.update_agent_base_percentage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update base_percentage when commission_tier_id changes
  IF NEW.commission_tier_id IS NOT NULL THEN
    SELECT base_percentage INTO NEW.base_percentage
    FROM commission_tiers
    WHERE id = NEW.commission_tier_id 
      AND is_active = true;
  ELSE
    NEW.base_percentage := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update base_percentage
CREATE TRIGGER update_agent_base_percentage_trigger
  BEFORE INSERT OR UPDATE OF commission_tier_id ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_base_percentage();

-- Update existing agents with base_percentage from their commission tiers
UPDATE public.agents 
SET base_percentage = ct.base_percentage
FROM commission_tiers ct
WHERE agents.commission_tier_id = ct.id 
  AND ct.is_active = true
  AND agents.commission_tier_id IS NOT NULL;