-- Fix security warning by updating function with proper search_path
CREATE OR REPLACE FUNCTION update_policy_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';