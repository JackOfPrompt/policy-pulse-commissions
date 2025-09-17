-- Remove triggers that auto-calculate commissions on policy insertion
DROP TRIGGER IF EXISTS auto_calculate_commission_splits_trigger ON policies;
DROP TRIGGER IF EXISTS insert_policy_commission_trigger ON policies;

-- Update validate_policy_source_assignment function to use internal/external mapping
CREATE OR REPLACE FUNCTION public.validate_policy_source_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Map source types: internal = employee, external = agent/misp/posp
  IF NEW.source_type = 'internal' AND NEW.employee_id IS NULL THEN
    RAISE EXCEPTION 'employee_id must not be null when source_type is internal';
  END IF;

  IF NEW.source_type = 'external' AND NEW.agent_id IS NULL AND NEW.misp_id IS NULL AND NEW.posp_id IS NULL THEN
    RAISE EXCEPTION 'agent_id, misp_id, or posp_id must be set when source_type is external';
  END IF;
  
  -- Clear inappropriate source IDs based on source type
  IF NEW.source_type = 'internal' THEN
    -- Keep employee_id, clear others
    NEW.agent_id := NULL;
    NEW.posp_id := NULL; 
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'external' THEN
    -- Keep agent/misp/posp IDs, clear employee_id for external sources
    NEW.employee_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;