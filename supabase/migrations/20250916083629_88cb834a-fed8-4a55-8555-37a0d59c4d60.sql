-- Create the revenue_table view without RLS (views inherit security from underlying tables)
CREATE OR REPLACE VIEW revenue_table AS
WITH base AS (
  SELECT
    p.id AS policy_id,
    p.policy_number,
    p.org_id,
    p.provider_id,
    p.product_type_id,
    p.source_type,
    p.agent_id,
    p.employee_id,
    COALESCE(p.gross_premium, p.premium_with_gst, p.premium_without_gst, 0) AS premium
  FROM policies p
  WHERE p.policy_status = 'active'
),

grid_rates AS (
  SELECT
    b.policy_id,
    b.org_id,
    COALESCE(l.product_type, h.product_type, m.product_type, 'unknown') AS product_type,
    COALESCE(
      l.commission_rate, h.commission_rate, m.commission_rate, 0
    ) AS base_rate,
    COALESCE(
      l.reward_rate, h.reward_rate, m.reward_rate, 0
    ) AS reward_rate,
    COALESCE(
      l.bonus_commission_rate, h.bonus_commission_rate, m.bonus_commission_rate, 0
    ) AS bonus_rate
  FROM base b
  LEFT JOIN life_payout_grid l
    ON l.provider_id = b.provider_id
   AND l.product_type_id = b.product_type_id
   AND l.org_id = b.org_id
   AND l.is_active = true
   AND CURRENT_DATE BETWEEN l.commission_start_date AND COALESCE(l.commission_end_date, CURRENT_DATE)
  LEFT JOIN health_payout_grid h
    ON h.provider_id = b.provider_id
   AND h.product_type_id = b.product_type_id
   AND h.org_id = b.org_id
   AND h.is_active = true
   AND CURRENT_DATE BETWEEN h.effective_from AND COALESCE(h.effective_to, CURRENT_DATE)
  LEFT JOIN motor_payout_grid m
    ON m.provider_id = b.provider_id
   AND m.product_type_id = b.product_type_id
   AND m.org_id = b.org_id
   AND m.is_active = true
   AND CURRENT_DATE BETWEEN m.effective_from AND COALESCE(m.effective_to, CURRENT_DATE)
  WHERE COALESCE(l.commission_rate, h.commission_rate, m.commission_rate) IS NOT NULL
),

calc AS (
  SELECT
    b.policy_id,
    b.policy_number,
    b.org_id,
    gr.product_type,
    b.premium,
    b.agent_id,
    b.source_type,
    gr.base_rate,
    gr.reward_rate,
    gr.bonus_rate,
    (gr.base_rate + gr.reward_rate + gr.bonus_rate) AS total_rate,
    ROUND(b.premium * (gr.base_rate + gr.reward_rate + gr.bonus_rate) / 100.0, 2) AS insurer_commission,
    CASE WHEN b.source_type = 'internal' THEN 'Employee' ELSE 'Agent' END AS source_name
  FROM base b
  JOIN grid_rates gr ON gr.policy_id = b.policy_id
)

SELECT
  c.policy_id,
  c.policy_number,
  c.org_id,
  c.product_type,
  c.premium,
  c.base_rate,
  c.reward_rate,
  c.bonus_rate,
  c.total_rate,
  c.insurer_commission,
  c.source_type,
  c.source_name,

  -- Agent commission only for external
  CASE 
    WHEN c.source_type = 'external' THEN
      ROUND(
        c.insurer_commission *
        COALESCE(a.override_percentage, ct.base_percentage, 0) / 100.0, 2
      )
    ELSE 0
  END AS agent_commission,

  -- Reporting employee commission only for external (insurer - agent share)
  CASE 
    WHEN c.source_type = 'external' THEN
      GREATEST(
        0,
        c.insurer_commission -
        (c.insurer_commission * COALESCE(a.override_percentage, ct.base_percentage, 0) / 100.0)
      )
    ELSE 0
  END AS reporting_employee_commission,

  -- Employee commission only for internal (base% of premium)
  CASE
    WHEN c.source_type = 'internal' THEN
      ROUND(c.premium * c.base_rate / 100.0, 2)
    ELSE 0
  END AS employee_commission,

  -- Broker share (company share)
  CASE
    WHEN c.source_type = 'internal' THEN
      ROUND(c.premium * (c.reward_rate + c.bonus_rate) / 100.0, 2)
    ELSE 0
  END AS broker_share

FROM calc c
LEFT JOIN agents a ON a.id = c.agent_id
LEFT JOIN commission_tiers ct ON ct.id = a.commission_tier_id;