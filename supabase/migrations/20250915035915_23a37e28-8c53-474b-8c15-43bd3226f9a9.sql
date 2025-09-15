-- Fix search_path security issue for the validation function
CREATE OR REPLACE FUNCTION validate_policy_source_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If source_type is set, ensure the corresponding ID is also set
  IF NEW.source_type = 'employee' AND NEW.employee_id IS NULL THEN
    RAISE EXCEPTION 'employee_id must not be null when source_type is employee';
  END IF;
  
  IF NEW.source_type = 'posp' AND NEW.posp_id IS NULL THEN
    RAISE EXCEPTION 'posp_id must not be null when source_type is posp';
  END IF;
  
  IF NEW.source_type = 'misp' AND NEW.misp_id IS NULL THEN
    RAISE EXCEPTION 'misp_id must not be null when source_type is misp';
  END IF;
  
  -- Ensure only one source ID is set based on source_type
  IF NEW.source_type = 'employee' THEN
    NEW.posp_id := NULL;
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'posp' THEN
    NEW.employee_id := NULL;
    NEW.misp_id := NULL;
  ELSIF NEW.source_type = 'misp' THEN
    NEW.employee_id := NULL;
    NEW.posp_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;