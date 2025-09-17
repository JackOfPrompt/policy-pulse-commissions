-- Add unique constraint on policy_id for policy_commissions table
-- This is needed for ON CONFLICT clauses in the save-policy edge function
ALTER TABLE policy_commissions 
ADD CONSTRAINT policy_commissions_policy_id_unique UNIQUE (policy_id);