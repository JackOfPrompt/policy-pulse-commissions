-- Revenue reporting views with tenant-aware RLS

-- GWP from fact_premiums joined to policies via bridge
CREATE OR REPLACE VIEW public.vw_revenue_gwp AS
SELECT
  p.tenant_id            AS tenant_id,
  pm.policy_uuid         AS policy_id,
  p.policy_number,
  fp.txn_date::date      AS txn_date,
  fp.txn_type,
  fp.premium_amount,
  fp.gst_amount,
  fp.insurer_id,
  fp.product_id,
  fp.branch_id,
  fp.agent_id
FROM public.fact_premiums fp
JOIN public.policy_map pm ON pm.legacy_policy_id = fp.policy_id
JOIN public.policies p    ON p.policy_id = pm.policy_uuid
WHERE EXISTS (
  SELECT 1 FROM public.profiles pr
  WHERE pr.user_id = auth.uid()
    AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
);

-- Commission earnings (date via fact_premiums if premium_id maps to txn_id)
CREATE OR REPLACE VIEW public.vw_commission AS
SELECT
  p.tenant_id                 AS tenant_id,
  pm.policy_uuid              AS policy_id,
  p.policy_number,
  fp.txn_date::date           AS txn_date,
  ce.base_amount,
  ce.bonus_amount,
  ce.total_amount,
  ce.compliance_status,
  ce.rule_id,
  ce.org_id,
  ce.insurer_id,
  ce.product_id
FROM public.commission_earnings ce
LEFT JOIN public.fact_premiums fp ON fp.txn_id = ce.premium_id
JOIN public.policy_map pm ON pm.legacy_policy_id = ce.policy_id
JOIN public.policies p    ON p.policy_id = pm.policy_uuid
WHERE EXISTS (
  SELECT 1 FROM public.profiles pr
  WHERE pr.user_id = auth.uid()
    AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
);

-- Renewals view
CREATE OR REPLACE VIEW public.vw_renewals AS
SELECT
  p.tenant_id                 AS tenant_id,
  pm.policy_uuid              AS policy_id,
  p.policy_number,
  re.due_date::date           AS due_date,
  re.renewal_date::date       AS renewal_date,
  re.renewed,
  re.original_premium,
  re.renewed_premium,
  re.reason_code
FROM public.fact_renewal_events re
JOIN public.policy_map pm ON pm.legacy_policy_id = re.policy_id
JOIN public.policies p    ON p.policy_id = pm.policy_uuid
WHERE EXISTS (
  SELECT 1 FROM public.profiles pr
  WHERE pr.user_id = auth.uid()
    AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
);

-- Payouts view (already tenant_uuid)
CREATE OR REPLACE VIEW public.vw_payouts AS
SELECT
  po.tenant_id,
  po.org_id,
  po.payout_id,
  po.request_date::date AS request_date,
  po.amount,
  po.status,
  po.payment_ref,
  po.approved_by,
  po.created_at
FROM public.finance_payouts po
WHERE EXISTS (
  SELECT 1 FROM public.profiles pr
  WHERE pr.user_id = auth.uid()
    AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = po.tenant_id)
);

-- Settlements view (already tenant_uuid)
CREATE OR REPLACE VIEW public.vw_settlements AS
SELECT
  st.tenant_id,
  st.settlement_id,
  st.period::date       AS period,
  st.insurer_id,
  st.expected_amount,
  st.received_amount,
  st.variance_amount,
  st.status,
  st.created_at,
  st.approved_by
FROM public.finance_settlements st
WHERE EXISTS (
  SELECT 1 FROM public.profiles pr
  WHERE pr.user_id = auth.uid()
    AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = st.tenant_id)
);

-- Revenue overview aggregating all metrics by tenant/date
CREATE OR REPLACE VIEW public.vw_revenue_overview AS
WITH gwp AS (
  SELECT p.tenant_id AS tenant_id, fp.txn_date::date AS d, SUM(fp.premium_amount) AS total_gwp
  FROM public.fact_premiums fp
  JOIN public.policy_map pm ON pm.legacy_policy_id = fp.policy_id
  JOIN public.policies p    ON p.policy_id = pm.policy_uuid
  GROUP BY 1,2
),
commission AS (
  SELECT p.tenant_id AS tenant_id, COALESCE(fp.txn_date::date, CURRENT_DATE) AS d, SUM(ce.total_amount) AS total_commission
  FROM public.commission_earnings ce
  LEFT JOIN public.fact_premiums fp ON fp.txn_id = ce.premium_id
  JOIN public.policy_map pm ON pm.legacy_policy_id = ce.policy_id
  JOIN public.policies p    ON p.policy_id = pm.policy_uuid
  GROUP BY 1,2
),
renewals AS (
  SELECT p.tenant_id AS tenant_id, re.due_date::date AS d, SUM(CASE WHEN re.renewed THEN re.renewed_premium ELSE 0 END) AS total_renewed
  FROM public.fact_renewal_events re
  JOIN public.policy_map pm ON pm.legacy_policy_id = re.policy_id
  JOIN public.policies p    ON p.policy_id = pm.policy_uuid
  GROUP BY 1,2
),
payouts AS (
  SELECT po.tenant_id AS tenant_id, po.request_date::date AS d, SUM(po.amount) AS total_payouts
  FROM public.finance_payouts po
  GROUP BY 1,2
),
settlements AS (
  SELECT st.tenant_id AS tenant_id, st.period::date AS d, SUM(st.received_amount) AS total_settlements
  FROM public.finance_settlements st
  GROUP BY 1,2
)
SELECT
  COALESCE(gwp.tenant_id, commission.tenant_id, renewals.tenant_id, payouts.tenant_id, settlements.tenant_id) AS tenant_id,
  COALESCE(gwp.d, commission.d, renewals.d, payouts.d, settlements.d) AS date,
  COALESCE(gwp.total_gwp, 0)          AS total_gwp,
  COALESCE(commission.total_commission, 0) AS total_commission,
  COALESCE(renewals.total_renewed, 0) AS total_renewed,
  COALESCE(payouts.total_payouts, 0)  AS total_payouts,
  COALESCE(settlements.total_settlements, 0) AS total_settlements
FROM gwp
FULL OUTER JOIN commission  ON commission.tenant_id = gwp.tenant_id AND commission.d = gwp.d
FULL OUTER JOIN renewals    ON renewals.tenant_id   = COALESCE(gwp.tenant_id, commission.tenant_id) AND renewals.d = COALESCE(gwp.d, commission.d)
FULL OUTER JOIN payouts     ON payouts.tenant_id    = COALESCE(gwp.tenant_id, commission.tenant_id, renewals.tenant_id) AND payouts.d = COALESCE(gwp.d, commission.d, renewals.d)
FULL OUTER JOIN settlements ON settlements.tenant_id= COALESCE(gwp.tenant_id, commission.tenant_id, renewals.tenant_id, payouts.tenant_id) AND settlements.d = COALESCE(gwp.d, commission.d, renewals.d, payouts.d)
WHERE EXISTS (
  SELECT 1 FROM public.profiles pr
  WHERE pr.user_id = auth.uid()
    AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = COALESCE(gwp.tenant_id, commission.tenant_id, renewals.tenant_id, payouts.tenant_id, settlements.tenant_id))
);