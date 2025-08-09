-- Create a sequence for policy numbers
CREATE SEQUENCE IF NOT EXISTS policy_number_sequence 
START WITH 1000001 
INCREMENT BY 1;

-- Create a function to generate policy numbers
CREATE OR REPLACE FUNCTION generate_policy_number()
RETURNS TEXT AS $$
DECLARE
  sequence_num TEXT;
  current_year TEXT;
BEGIN
  -- Get next sequence number and pad with zeros
  sequence_num := LPAD(nextval('policy_number_sequence')::TEXT, 7, '0');
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Return formatted policy number: POL-YYYY-NNNNNNN
  RETURN 'POL-' || current_year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;