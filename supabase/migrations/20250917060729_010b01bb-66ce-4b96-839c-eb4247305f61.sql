-- Drop and recreate enhanced commission report to handle missing MISP safely
DROP FUNCTION IF EXISTS public.calculate_enhanced_comprehensive_commission_report(uuid, uuid);

CREATE OR REPLACE FUNCTION public.calculate_enhanced_comprehensive_commission_report(
  p_org_id uuid DEFAULT NULL::uuid,
  p_policy_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  policy_id uuid,
  policy_number text,
  product_category text,
  product_name text,
  plan_name text,
  provider text,
  source_type text,
  grid_table text,
  grid_id uuid,
  base_commission_rate numeric,
  reward_commission_rate numeric,
  bonus_commission_rate numeric,
  total_commission_rate numeric,
  insurer_commission numeric,
  agent_commission numeric,
  misp_commission numeric,
  employee_commission numeric,
  reporting_employee_commission numeric,
  broker_share numeric,
  calc_date timestamptz,
  customer_name text,
  employee_name text,
  agent_name text,
  misp_name text,
  org_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec_policy RECORD;
  v_premium numeric := 0;
  v_sum_insured numeric := 0;
  v_base_rate numeric := 0;
  v_reward_rate numeric := 0;
  v_bonus_rate numeric := 0;
  v_total_rate numeric := 0;
  v_grid_table text := '';
  v_grid_id uuid := NULL;

  v_base_amount numeric := 0;
  v_reward_amount numeric := 0;
  v_bonus_amount numeric := 0;
  v_agent_amt numeric := 0;
  v_misp_amt numeric := 0;
  v_emp_amt numeric := 0;
  v_reporting_emp_amt numeric := 0;
  v_broker_share numeric := 0;

  agent_rec RECORD;
  misp_rec RECORD;
  employee_rec RECORD;
BEGIN
  -- Default org to current user's org when not provided
  IF p_org_id IS NULL THEN
    SELECT org_id INTO p_org_id
    FROM user_organizations 
    WHERE user_id = auth.uid() 
    LIMIT 1;
  END IF;

  FOR rec_policy IN
    SELECT 
      p.*, 
      pt.category AS product_category,
      pt.name AS product_name,
      CONCAT(COALESCE(c.first_name,''),' ',COALESCE(c.last_name,'')) AS customer_full_name,
      e.name AS employee_full_name,
      a.agent_name AS agent_full_name,
      m.channel_partner_name AS misp_full_name
    FROM policies p
    LEFT JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN employees e ON e.id = p.employee_id
    LEFT JOIN agents a ON a.id = p.agent_id
    LEFT JOIN misps m ON m.id = p.misp_id
    WHERE p.policy_status = 'active'
      AND (p_org_id IS NULL OR p.org_id = p_org_id)
      AND (p_policy_id IS NULL OR p.id = p_policy_id)
  LOOP
    -- Reset per-row vars
    v_premium := COALESCE(rec_policy.gross_premium, rec_policy.premium_with_gst, rec_policy.premium_without_gst, 0);
    v_sum_insured := COALESCE((rec_policy.dynamic_details->>'sum_insured')::numeric, 0);
    v_base_rate := 0; v_reward_rate := 0; v_bonus_rate := 0; v_total_rate := 0;
    v_grid_table := ''; v_grid_id := NULL;
    v_base_amount := 0; v_reward_amount := 0; v_bonus_amount := 0;
    v_agent_amt := 0; v_misp_amt := 0; v_emp_amt := 0; v_reporting_emp_amt := 0; v_broker_share := 0;

    agent_rec := NULL; misp_rec := NULL; employee_rec := NULL;

    -- Load source records conditionally (avoid unassigned record errors)
    IF rec_policy.agent_id IS NOT NULL THEN
      SELECT * INTO agent_rec FROM agents WHERE id = rec_policy.agent_id;
    END IF;
    IF rec_policy.misp_id IS NOT NULL THEN
      SELECT * INTO misp_rec FROM misps WHERE id = rec_policy.misp_id;
    END IF;
    IF rec_policy.employee_id IS NOT NULL THEN
      SELECT * INTO employee_rec FROM employees WHERE id = rec_policy.employee_id;
    END IF;

    -- Match payout grid by product category
    IF LOWER(rec_policy.product_category) = 'life' THEN
      SELECT lpg.id, lpg.commission_rate, COALESCE(lpg.reward_rate,0), COALESCE(lpg.bonus_commission_rate,0)
      INTO v_grid_id, v_base_rate, v_reward_rate, v_bonus_rate
      FROM life_payout_grid lpg
      LEFT JOIN life_policy_details lpd ON lpd.policy_id = rec_policy.id
      WHERE lpg.org_id = rec_policy.org_id
        AND lpg.product_type = rec_policy.product_category
        AND (
          (lpg.provider_id IS NOT NULL AND rec_policy.provider_id IS NOT NULL AND lpg.provider_id = rec_policy.provider_id)
          OR (lpg.provider_id IS NULL AND rec_policy.provider_id IS NULL AND lower(lpg.provider) = lower(COALESCE(rec_policy.provider,'')))
        )
        AND (lpg.product_sub_type IS NULL OR lpg.product_sub_type = COALESCE(lpd.plan_type,''))
        AND (lpg.plan_name IS NULL OR lpg.plan_name = rec_policy.plan_name)
        AND (lpg.ppt IS NULL OR lpg.ppt = COALESCE(lpd.premium_payment_term,0))
        AND (lpg.pt IS NULL OR lpg.pt = COALESCE(lpd.policy_term,0))
        AND (
          (lpg.min_premium IS NULL AND lpg.max_premium IS NULL)
          OR (v_premium BETWEEN COALESCE(lpg.min_premium,0) AND COALESCE(lpg.max_premium,999999999))
        )
        AND lpg.is_active = TRUE
        AND COALESCE(rec_policy.issue_date, rec_policy.start_date, CURRENT_DATE) BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
      ORDER BY lpg.created_at DESC
      LIMIT 1;
      IF FOUND THEN v_grid_table := 'life_payout_grid'; END IF;

    ELSIF LOWER(rec_policy.product_category) = 'health' THEN
      SELECT hpg.id, hpg.commission_rate, COALESCE(hpg.reward_rate,0), COALESCE(hpg.bonus_commission_rate,0)
      INTO v_grid_id, v_base_rate, v_reward_rate, v_bonus_rate
      FROM health_payout_grid hpg
      LEFT JOIN health_policy_details hpd ON hpd.policy_id = rec_policy.id
      WHERE hpg.org_id = rec_policy.org_id
        AND hpg.product_type = rec_policy.product_category
        AND (
          (hpg.provider_id IS NOT NULL AND rec_policy.provider_id IS NOT NULL AND hpg.provider_id = rec_policy.provider_id)
          OR (hpg.provider_id IS NULL AND rec_policy.provider_id IS NULL AND lower(hpg.provider) = lower(COALESCE(rec_policy.provider,'')))
        )
        AND (hpg.product_sub_type IS NULL OR hpg.product_sub_type = COALESCE(hpd.cover_type,''))
        AND (hpg.plan_name IS NULL OR hpg.plan_name = rec_policy.plan_name)
        AND (
          (hpg.min_premium IS NULL AND hpg.max_premium IS NULL)
          OR (v_premium BETWEEN COALESCE(hpg.min_premium,0) AND COALESCE(hpg.max_premium,999999999))
        )
        AND (
          (hpg.sum_insured_min IS NULL AND hpg.sum_insured_max IS NULL)
          OR (v_sum_insured BETWEEN COALESCE(hpg.sum_insured_min,0) AND COALESCE(hpg.sum_insured_max,999999999))
        )
        AND hpg.is_active = TRUE
        AND COALESCE(rec_policy.issue_date, rec_policy.start_date, CURRENT_DATE) BETWEEN hpg.effective_from AND COALESCE(hpg.effective_to, CURRENT_DATE)
      ORDER BY hpg.created_at DESC
      LIMIT 1;
      IF FOUND THEN v_grid_table := 'health_payout_grid'; END IF;

    ELSIF LOWER(rec_policy.product_category) = 'motor' THEN
      SELECT mpg.id, mpg.commission_rate, COALESCE(mpg.reward_rate,0), COALESCE(mpg.bonus_commission_rate,0)
      INTO v_grid_id, v_base_rate, v_reward_rate, v_bonus_rate
      FROM motor_payout_grid mpg
      LEFT JOIN motor_policy_details mpd ON mpd.policy_id = rec_policy.id
      WHERE mpg.org_id = rec_policy.org_id
        AND mpg.product_type = rec_policy.product_category
        AND (
          (mpg.provider_id IS NOT NULL AND rec_policy.provider_id IS NOT NULL AND mpg.provider_id = rec_policy.provider_id)
          OR (mpg.provider_id IS NULL AND rec_policy.provider_id IS NULL AND lower(mpg.provider) = lower(COALESCE(rec_policy.provider,'')))
        )
        AND (mpg.product_subtype IS NULL OR mpg.product_subtype = COALESCE(mpd.policy_type,''))
        AND (
          (mpg.min_premium IS NULL AND mpg.max_premium IS NULL)
          OR (v_premium BETWEEN COALESCE(mpg.min_premium,0) AND COALESCE(mpg.max_premium,999999999))
        )
        AND mpg.is_active = TRUE
        AND COALESCE(rec_policy.issue_date, rec_policy.start_date, CURRENT_DATE) BETWEEN mpg.effective_from AND COALESCE(mpg.effective_to, CURRENT_DATE)
      ORDER BY mpg.created_at DESC
      LIMIT 1;
      IF FOUND THEN v_grid_table := 'motor_payout_grid'; END IF;
    END IF;

    -- Compute amounts
    v_total_rate := v_base_rate + v_reward_rate + v_bonus_rate;
    v_base_amount := v_premium * v_base_rate / 100;
    v_reward_amount := v_premium * v_reward_rate / 100;
    v_bonus_amount := v_premium * v_bonus_rate / 100;

    IF rec_policy.source_type = 'internal' AND employee_rec IS NOT NULL THEN
      v_emp_amt := v_base_amount;                    -- employee gets base
      v_broker_share := v_reward_amount + v_bonus_amount; -- broker gets reward+bonus

    ELSIF rec_policy.source_type = 'external' AND agent_rec IS NOT NULL THEN
      v_agent_amt := v_base_amount * COALESCE(agent_rec.override_percentage, agent_rec.base_percentage, 50) / 100;
      v_broker_share := (v_base_amount - v_agent_amt) + v_reward_amount + v_bonus_amount;

    ELSIF rec_policy.source_type = 'external' AND misp_rec IS NOT NULL THEN
      v_misp_amt := v_base_amount * COALESCE(misp_rec.override_percentage, misp_rec.percentage, 50) / 100;
      v_broker_share := (v_base_amount - v_misp_amt) + v_reward_amount + v_bonus_amount;

    ELSE
      -- direct org sale
      v_broker_share := v_base_amount + v_reward_amount + v_bonus_amount;
    END IF;

    -- Return row, guarding against NULL records
    policy_id := rec_policy.id;
    policy_number := rec_policy.policy_number;
    product_category := rec_policy.product_category;
    product_name := rec_policy.product_name;
    plan_name := rec_policy.plan_name;
    provider := rec_policy.provider;
    source_type := COALESCE(rec_policy.source_type, '');
    grid_table := v_grid_table;
    grid_id := v_grid_id;
    base_commission_rate := v_base_rate;
    reward_commission_rate := v_reward_rate;
    bonus_commission_rate := v_bonus_rate;
    total_commission_rate := v_total_rate;
    insurer_commission := v_base_amount; -- base amount only per existing usage
    agent_commission := v_agent_amt;
    misp_commission := v_misp_amt;
    employee_commission := v_emp_amt;
    reporting_employee_commission := v_reporting_emp_amt; -- set to 0 for now
    broker_share := v_broker_share;
    calc_date := NOW();
    customer_name := COALESCE(rec_policy.customer_full_name, '');
    employee_name := COALESCE(rec_policy.employee_full_name, '');
    agent_name := COALESCE(rec_policy.agent_full_name, '');
    misp_name := COALESCE(rec_policy.misp_full_name, '');
    org_id := rec_policy.org_id;

    RETURN NEXT;
  END LOOP;
END;
$function$;