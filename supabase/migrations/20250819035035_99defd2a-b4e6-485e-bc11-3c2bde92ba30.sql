-- Phase 1: Safe normalization scaffolding for fact tables
-- - Adds new normalized FK columns (keeps legacy columns intact)
-- - Creates legacy->normalized mapping tables
-- - Adds NOT VALID foreign keys (to be validated after backfill)
-- - Creates helper views and triggers to auto-populate refs from mappings

-- 0) Enable required extension (if not already)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Mapping tables
CREATE TABLE IF NOT EXISTS public.legacy_agent_map (
  legacy_agent_id integer PRIMARY KEY,
  agent_id bigint NOT NULL REFERENCES public.agents(agent_id)
);
CREATE INDEX IF NOT EXISTS idx_legacy_agent_map_agent_id ON public.legacy_agent_map(agent_id);

CREATE TABLE IF NOT EXISTS public.legacy_branch_map (
  legacy_branch_id integer PRIMARY KEY,
  branch_id bigint NOT NULL REFERENCES public.branches(branch_id)
);
CREATE INDEX IF NOT EXISTS idx_legacy_branch_map_branch_id ON public.legacy_branch_map(branch_id);

CREATE TABLE IF NOT EXISTS public.legacy_provider_map (
  legacy_provider_id integer PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.master_insurance_providers(provider_id)
);
CREATE INDEX IF NOT EXISTS idx_legacy_provider_map_provider_id ON public.legacy_provider_map(provider_id);

CREATE TABLE IF NOT EXISTS public.legacy_product_map (
  legacy_product_id integer PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products_unified(id)
);
CREATE INDEX IF NOT EXISTS idx_legacy_product_map_product_id ON public.legacy_product_map(product_id);

CREATE TABLE IF NOT EXISTS public.legacy_tenant_map (
  legacy_tenant_id integer PRIMARY KEY,
  tenant_id uuid NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_legacy_tenant_map_tenant_id ON public.legacy_tenant_map(tenant_id);

-- 2) Alter fact tables: add normalized reference columns (nullable for now)
ALTER TABLE public.fact_premiums
  ADD COLUMN IF NOT EXISTS agent_ref bigint,
  ADD COLUMN IF NOT EXISTS branch_ref bigint,
  ADD COLUMN IF NOT EXISTS provider_ref uuid,
  ADD COLUMN IF NOT EXISTS product_ref uuid,
  ADD COLUMN IF NOT EXISTS tenant_ref uuid;

ALTER TABLE public.fact_invoices
  ADD COLUMN IF NOT EXISTS tenant_ref uuid;

ALTER TABLE public.fact_claims
  ADD COLUMN IF NOT EXISTS tenant_ref uuid;

ALTER TABLE public.fact_renewal_events
  ADD COLUMN IF NOT EXISTS tenant_ref uuid;

-- 3) Add NOT VALID foreign keys so we don't block existing data
ALTER TABLE public.fact_premiums
  ADD CONSTRAINT IF NOT EXISTS fk_fact_premiums_agent_ref FOREIGN KEY (agent_ref) REFERENCES public.agents(agent_id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS fk_fact_premiums_branch_ref FOREIGN KEY (branch_ref) REFERENCES public.branches(branch_id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS fk_fact_premiums_provider_ref FOREIGN KEY (provider_ref) REFERENCES public.master_insurance_providers(provider_id) NOT VALID,
  ADD CONSTRAINT IF NOT EXISTS fk_fact_premiums_product_ref FOREIGN KEY (product_ref) REFERENCES public.products_unified(id) NOT VALID;

-- 4) Helper trigger to auto-apply mappings on fact_premiums insert/update
CREATE OR REPLACE FUNCTION public.fact_premiums_apply_mappings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL THEN
    SELECT lam.agent_id INTO NEW.agent_ref FROM public.legacy_agent_map lam WHERE lam.legacy_agent_id = NEW.agent_id;
  END IF;
  IF NEW.branch_id IS NOT NULL THEN
    SELECT lbm.branch_id INTO NEW.branch_ref FROM public.legacy_branch_map lbm WHERE lbm.legacy_branch_id = NEW.branch_id;
  END IF;
  IF NEW.insurer_id IS NOT NULL THEN
    SELECT lpr.provider_id INTO NEW.provider_ref FROM public.legacy_provider_map lpr WHERE lpr.legacy_provider_id = NEW.insurer_id;
  END IF;
  IF NEW.product_id IS NOT NULL THEN
    SELECT lpm.product_id INTO NEW.product_ref FROM public.legacy_product_map lpm WHERE lpm.legacy_product_id = NEW.product_id;
  END IF;
  IF NEW.tenant_id IS NOT NULL THEN
    SELECT ltm.tenant_id INTO NEW.tenant_ref FROM public.legacy_tenant_map ltm WHERE ltm.legacy_tenant_id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS fact_premiums_apply_mappings_trg ON public.fact_premiums;
CREATE TRIGGER fact_premiums_apply_mappings_trg
BEFORE INSERT OR UPDATE ON public.fact_premiums
FOR EACH ROW EXECUTE FUNCTION public.fact_premiums_apply_mappings();

-- 5) Backfill normalized refs from mapping tables where available
UPDATE public.fact_premiums fp
SET agent_ref = lam.agent_id
FROM public.legacy_agent_map lam
WHERE lam.legacy_agent_id = fp.agent_id AND (fp.agent_ref IS DISTINCT FROM lam.agent_id);

UPDATE public.fact_premiums fp
SET branch_ref = lbm.branch_id
FROM public.legacy_branch_map lbm
WHERE lbm.legacy_branch_id = fp.branch_id AND (fp.branch_ref IS DISTINCT FROM lbm.branch_id);

UPDATE public.fact_premiums fp
SET provider_ref = lpr.provider_id
FROM public.legacy_provider_map lpr
WHERE lpr.legacy_provider_id = fp.insurer_id AND (fp.provider_ref IS DISTINCT FROM lpr.provider_id);

UPDATE public.fact_premiums fp
SET product_ref = lpm.product_id
FROM public.legacy_product_map lpm
WHERE lpm.legacy_product_id = fp.product_id AND (fp.product_ref IS DISTINCT FROM lpm.product_id);

UPDATE public.fact_premiums fp
SET tenant_ref = ltm.tenant_id
FROM public.legacy_tenant_map ltm
WHERE ltm.legacy_tenant_id = fp.tenant_id AND (fp.tenant_ref IS DISTINCT FROM ltm.tenant_id);

-- 6) Normalized helper views (read-only, safe to use for analytics without code changes yet)
CREATE OR REPLACE VIEW public.fact_premiums_normalized AS
SELECT 
  fp.txn_id,
  fp.policy_id,
  fp.txn_date,
  fp.dim_date_id,
  fp.currency,
  fp.txn_type,
  fp.premium_amount,
  fp.gst_amount,
  -- legacy columns
  fp.tenant_id AS legacy_tenant_id,
  fp.insurer_id AS legacy_insurer_id,
  fp.product_id AS legacy_product_id,
  fp.branch_id AS legacy_branch_id,
  fp.agent_id AS legacy_agent_id,
  -- normalized FKs via mapping (preferred)
  COALESCE(fp.tenant_ref, ltm.tenant_id) AS tenant_id,
  COALESCE(fp.provider_ref, lpr.provider_id) AS provider_id,
  COALESCE(fp.product_ref, lpm.product_id) AS product_id,
  COALESCE(fp.branch_ref, lbm.branch_id) AS branch_id,
  COALESCE(fp.agent_ref, lam.agent_id) AS agent_id
FROM public.fact_premiums fp
LEFT JOIN public.legacy_agent_map   lam ON lam.legacy_agent_id   = fp.agent_id
LEFT JOIN public.legacy_branch_map  lbm ON lbm.legacy_branch_id  = fp.branch_id
LEFT JOIN public.legacy_provider_map lpr ON lpr.legacy_provider_id = fp.insurer_id
LEFT JOIN public.legacy_product_map lpm ON lpm.legacy_product_id = fp.product_id
LEFT JOIN public.legacy_tenant_map  ltm ON ltm.legacy_tenant_id  = fp.tenant_id;

CREATE OR REPLACE VIEW public.fact_invoices_normalized AS
SELECT 
  fi.invoice_id,
  fi.invoice_number,
  fi.invoice_type,
  fi.policy_id,
  fi.status,
  fi.due_date,
  fi.amount_due,
  fi.amount_paid,
  fi.created_at,
  fi.tenant_id AS legacy_tenant_id,
  COALESCE(fi.tenant_ref, ltm.tenant_id) AS tenant_id
FROM public.fact_invoices fi
LEFT JOIN public.legacy_tenant_map ltm ON ltm.legacy_tenant_id = fi.tenant_id;

CREATE OR REPLACE VIEW public.fact_claims_normalized AS
SELECT 
  fc.claim_id,
  fc.claim_number,
  fc.policy_id,
  fc.claim_type,
  fc.status,
  fc.cause_of_loss,
  fc.intimation_date,
  fc.decision_date,
  fc.settlement_amount,
  fc.created_at,
  fc.tenant_id AS legacy_tenant_id,
  COALESCE(fc.tenant_ref, ltm.tenant_id) AS tenant_id
FROM public.fact_claims fc
LEFT JOIN public.legacy_tenant_map ltm ON ltm.legacy_tenant_id = fc.tenant_id;

CREATE OR REPLACE VIEW public.fact_renewal_events_normalized AS
SELECT 
  fre.renewal_id,
  fre.policy_id,
  fre.due_date,
  fre.renewal_date,
  fre.renewed,
  fre.reason_code,
  fre.original_premium,
  fre.renewed_premium,
  fre.created_at,
  fre.tenant_id AS legacy_tenant_id,
  COALESCE(fre.tenant_ref, ltm.tenant_id) AS tenant_id
FROM public.fact_renewal_events fre
LEFT JOIN public.legacy_tenant_map ltm ON ltm.legacy_tenant_id = fre.tenant_id;

-- 7) Helpful partial indexes on normalized columns
CREATE INDEX IF NOT EXISTS idx_fact_premiums_agent_ref   ON public.fact_premiums(agent_ref);
CREATE INDEX IF NOT EXISTS idx_fact_premiums_branch_ref  ON public.fact_premiums(branch_ref);
CREATE INDEX IF NOT EXISTS idx_fact_premiums_provider_ref ON public.fact_premiums(provider_ref);
CREATE INDEX IF NOT EXISTS idx_fact_premiums_product_ref ON public.fact_premiums(product_ref);
CREATE INDEX IF NOT EXISTS idx_fact_premiums_tenant_ref  ON public.fact_premiums(tenant_ref);
CREATE INDEX IF NOT EXISTS idx_fact_invoices_tenant_ref  ON public.fact_invoices(tenant_ref);
CREATE INDEX IF NOT EXISTS idx_fact_claims_tenant_ref    ON public.fact_claims(tenant_ref);
CREATE INDEX IF NOT EXISTS idx_fact_renewal_events_tenant_ref ON public.fact_renewal_events(tenant_ref);

-- 8) Verification query stub (won't run as part of migration, but kept here for reference)
-- SELECT count(*) FROM public.fact_premiums_normalized;