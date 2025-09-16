-- Function to insert agent/misp commission history after a policy is inserted/updated
CREATE OR REPLACE FUNCTION public.insert_agent_comm_history_on_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dist RECORD;
  applied_tier uuid;
  used_override bool;
  pct numeric(8,4);
  amt numeric(12,2);
BEGIN
  -- Look up commission distribution for this policy
  SELECT *
  INTO dist
  FROM policy_commission_distribution_view
  WHERE policy_id = NEW.id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Determine applied tier & override flag
  IF dist.source_type = 'agent' AND NEW.agent_id IS NOT NULL THEN
    SELECT a.override_percentage, a.commission_tier_id
    INTO pct, applied_tier
    FROM agents a WHERE a.id = NEW.agent_id;

    used_override := pct IS NOT NULL;
    pct := COALESCE(pct, (SELECT base_percentage FROM commission_tiers ct WHERE ct.id = applied_tier), 0);
    amt := dist.agent_commission_amount;

    INSERT INTO agent_commission_history (org_id, agent_id, misp_id, policy_id,
      applied_tier_id, used_override, commission_percentage, commission_amount)
    VALUES (NEW.org_id, NEW.agent_id, NULL, NEW.id,
      applied_tier, used_override, pct, amt);

  ELSIF dist.source_type = 'misp' AND NEW.misp_id IS NOT NULL THEN
    SELECT m.override_percentage, m.commission_tier_id
    INTO pct, applied_tier
    FROM misps m WHERE m.id = NEW.misp_id;

    used_override := pct IS NOT NULL;
    pct := COALESCE(pct, (SELECT base_percentage FROM commission_tiers ct WHERE ct.id = applied_tier), 0);
    amt := dist.misp_commission_amount;

    INSERT INTO agent_commission_history (org_id, agent_id, misp_id, policy_id,
      applied_tier_id, used_override, commission_percentage, commission_amount)
    VALUES (NEW.org_id, NULL, NEW.misp_id, NEW.id,
      applied_tier, used_override, pct, amt);

  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_insert_agent_comm_history ON policies;

-- Create trigger: fire after insert or update on policies
CREATE TRIGGER trg_insert_agent_comm_history
AFTER INSERT OR UPDATE OF agent_id, misp_id, premium_with_gst, gross_premium, premium_without_gst
ON policies
FOR EACH ROW
EXECUTE PROCEDURE public.insert_agent_comm_history_on_policy();