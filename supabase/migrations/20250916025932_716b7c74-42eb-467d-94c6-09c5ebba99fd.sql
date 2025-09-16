-- Standardize policy source validation to include 'agent' and ensure exclusive IDs
CREATE OR REPLACE FUNCTION public.validate_policy_source_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure required source IDs when source_type is set
  IF NEW.source_type = 'employee' AND NEW.employee_id IS NULL THEN
    RAISE EXCEPTION 'employee_id must not be null when source_type is employee';
  END IF;

  IF NEW.source_type = 'agent' AND NEW.agent_id IS NULL THEN
    RAISE EXCEPTION 'agent_id must not be null when source_type is agent';
  END IF;
  
  IF NEW.source_type = 'posp' AND NEW.posp_id IS NULL THEN
    RAISE EXCEPTION 'posp_id must not be null when source_type is posp';
  END IF;
  
  IF NEW.source_type = 'misp' AND NEW.misp_id IS NULL THEN
    RAISE EXCEPTION 'misp_id must not be null when source_type is misp';
  END IF;
  
  -- Ensure only the relevant source ID is set
  IF NEW.source_type = 'employee' THEN
    NEW.agent_id := NULL;
    NEW.posp_id := NULL;
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'agent' THEN
    NEW.employee_id := NULL;
    NEW.posp_id := NULL;
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'posp' THEN
    NEW.employee_id := NULL;
    NEW.agent_id := NULL;
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'misp' THEN
    NEW.employee_id := NULL;
    NEW.agent_id := NULL;
    NEW.posp_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;