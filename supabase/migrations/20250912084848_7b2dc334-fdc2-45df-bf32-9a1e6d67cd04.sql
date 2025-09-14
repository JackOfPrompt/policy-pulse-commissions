-- Fix security issue: Update function with proper search path
CREATE OR REPLACE FUNCTION calculate_life_total_rate()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_rate = COALESCE(NEW.commission_rate, 0) + COALESCE(NEW.reward_rate, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;