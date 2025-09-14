-- Add versioning columns to existing payout grid tables
ALTER TABLE public.motor_payout_grid
ADD COLUMN IF NOT EXISTS valid_from date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valid_to date,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.health_payout_grid
ADD COLUMN IF NOT EXISTS valid_from date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valid_to date,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.life_payout_grid
ADD COLUMN IF NOT EXISTS valid_from date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valid_to date,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create policy_commissions table
CREATE TABLE IF NOT EXISTS public.policy_commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id uuid NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    org_id uuid NOT NULL,
    product_type text NOT NULL,
    grid_table text,            -- motor/health/life
    grid_id uuid,               -- the specific grid row applied
    commission_rate numeric(8,2) NOT NULL,
    reward_rate numeric(8,2) DEFAULT 0,
    total_rate numeric(8,2) GENERATED ALWAYS AS (commission_rate + COALESCE(reward_rate,0)) STORED,
    commission_amount numeric(12,2), -- premium * commission_rate%
    reward_amount numeric(12,2),     -- premium * reward_rate%
    total_amount numeric(12,2),      -- premium * total_rate%
    payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending','approved','paid')),
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

-- Enable RLS on policy_commissions
ALTER TABLE public.policy_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies for policy_commissions
CREATE POLICY "Users can view their organization's policy commissions" 
ON public.policy_commissions 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can manage their organization's policy commissions" 
ON public.policy_commissions 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Update get_commission function to return grid details
CREATE OR REPLACE FUNCTION public.get_commission(p_policy_id uuid)
RETURNS TABLE(
    policy_id uuid, 
    product_type text, 
    commission_rate numeric, 
    reward_rate numeric, 
    total_rate numeric,
    grid_table text,
    grid_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    p_type text;
    p_subtype text;
    p_provider text;
    p_plan_name text;
    p_plan_type text;
    p_suminsured numeric;
    p_premium numeric;
    p_ppt int;
    p_pt int;
BEGIN
    -- 1. Get policy type & details
    SELECT pt.category, pt.name, p.provider, p.plan_name, 
           COALESCE(lpd.plan_type, hpd.policy_type, mpd.policy_type) as plan_type,
           COALESCE(p.dynamic_details->>'sum_insured', '0')::numeric,
           COALESCE(p.premium_with_gst, p.premium_without_gst, 0)
    INTO p_type, p_subtype, p_provider, p_plan_name, p_plan_type,
         p_suminsured, p_premium
    FROM policies p
    JOIN product_types pt ON pt.id = p.product_type_id
    LEFT JOIN life_policy_details lpd ON lpd.policy_id = p.id
    LEFT JOIN health_policy_details hpd ON hpd.policy_id = p.id
    LEFT JOIN motor_policy_details mpd ON mpd.policy_id = p.id
    WHERE p.id = p_policy_id;

    -- 2. Handle Motor (special rules)
    IF p_type = 'motor' THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, mpg.commission_rate,
               COALESCE(mpg.reward_rate, 0)::numeric AS reward_rate,
               (mpg.commission_rate + COALESCE(mpg.reward_rate, 0))::numeric AS total_rate,
               'motor_payout_grid'::text AS grid_table,
               mpg.id AS grid_id
        FROM motor_payout_grid mpg
        JOIN motor_policy_details mpd ON mpd.policy_id = p_policy_id
        LEFT JOIN vehicles v ON v.id = mpd.vehicle_id
        WHERE mpg.product_type = p_type
          AND mpg.product_subtype = COALESCE(mpd.policy_sub_type, p_subtype)
          AND mpg.provider = p_provider
          AND (mpg.vehicle_make IS NULL OR mpg.vehicle_make = COALESCE(v.make, ''))
          AND (mpg.fuel_type_id IS NULL OR mpg.fuel_type_id::text = COALESCE(v.fuel_type, ''))
          AND (mpg.cc_range IS NULL OR mpg.cc_range = COALESCE(v.cc::text, ''))
          AND (mpg.ncb_percentage IS NULL OR mpg.ncb_percentage = COALESCE(mpd.ncb, 0))
          AND (mpg.coverage_type_id IS NULL OR mpg.coverage_type_id::text = COALESCE(mpd.policy_type, ''))
          AND mpg.is_active = true
          AND CURRENT_DATE BETWEEN mpg.valid_from AND COALESCE(mpg.valid_to, CURRENT_DATE)
        ORDER BY mpg.created_at DESC
        LIMIT 1;

    -- 3. Handle Health
    ELSIF p_type = 'health' THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, hpg.commission_rate,
               COALESCE(hpg.reward_rate, 0)::numeric AS reward_rate,
               (hpg.commission_rate + COALESCE(hpg.reward_rate, 0))::numeric AS total_rate,
               'health_payout_grid'::text AS grid_table,
               hpg.id AS grid_id
        FROM health_payout_grid hpg
        JOIN health_policy_details hpd ON hpd.policy_id = p_policy_id
        WHERE hpg.product_type = p_type
          AND hpg.product_sub_type = COALESCE(hpd.policy_type, p_subtype)
          AND hpg.provider = p_provider
          AND hpg.plan_name = p_plan_name
          AND (
            (hpg.sum_insured_min IS NULL AND hpg.sum_insured_max IS NULL)
            OR 
            (p_suminsured BETWEEN COALESCE(hpg.sum_insured_min, 0) AND COALESCE(hpg.sum_insured_max, 999999999))
          )
          AND hpg.is_active = true
          AND CURRENT_DATE BETWEEN hpg.valid_from AND COALESCE(hpg.valid_to, CURRENT_DATE)
        ORDER BY hpg.created_at DESC
        LIMIT 1;

    -- 4. Handle Life
    ELSIF p_type = 'life' THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, lpg.commission_rate,
               COALESCE(lpg.reward_rate, 0)::numeric AS reward_rate,
               COALESCE(lpg.total_rate, lpg.commission_rate + COALESCE(lpg.reward_rate, 0))::numeric AS total_rate,
               'life_payout_grid'::text AS grid_table,
               lpg.id AS grid_id
        FROM life_payout_grid lpg
        JOIN life_policy_details lpd ON lpd.policy_id = p_policy_id
        WHERE lpg.product_type = p_type
          AND (lpg.product_sub_type IS NULL OR lpg.product_sub_type = COALESCE(lpd.plan_type, p_subtype))
          AND lpg.provider = p_provider
          AND (lpg.plan_type IS NULL OR lpg.plan_type = COALESCE(lpd.plan_type, ''))
          AND (lpg.plan_name IS NULL OR lpg.plan_name = p_plan_name)
          AND (lpg.ppt IS NULL OR lpg.ppt = COALESCE(lpd.premium_payment_term, 0))
          AND (lpg.pt IS NULL OR lpg.pt = COALESCE(lpd.policy_term, 0))
          AND (
            (lpg.premium_start_price IS NULL AND lpg.premium_end_price IS NULL)
            OR 
            (p_premium BETWEEN COALESCE(lpg.premium_start_price, 0) AND COALESCE(lpg.premium_end_price, 999999999))
          )
          AND lpg.is_active = true
          AND CURRENT_DATE BETWEEN lpg.commission_start_date AND COALESCE(lpg.commission_end_date, CURRENT_DATE)
        ORDER BY lpg.created_at DESC
        LIMIT 1;

    -- 5. Handle All Future Products (fallback to 0 for now)
    ELSE
        RETURN QUERY
        SELECT p_policy_id, p_type, 0::numeric AS commission_rate,
               0::numeric AS reward_rate,
               0::numeric AS total_rate,
               ''::text AS grid_table,
               NULL::uuid AS grid_id;
    END IF;
    
    -- If no results found, return zero rates
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT p_policy_id, p_type, 0::numeric AS commission_rate,
               0::numeric AS reward_rate,
               0::numeric AS total_rate,
               ''::text AS grid_table,
               NULL::uuid AS grid_id;
    END IF;
END;
$function$;

-- Create function to persist commission when policy is issued
CREATE OR REPLACE FUNCTION public.persist_policy_commission(p_policy_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    commission_result RECORD;
    policy_record RECORD;
BEGIN
    -- Get commission calculation
    SELECT * INTO commission_result FROM public.get_commission(p_policy_id);
    
    -- Get policy details
    SELECT * INTO policy_record FROM policies WHERE id = p_policy_id;
    
    -- Only persist if commission rate is found
    IF commission_result.commission_rate IS NOT NULL AND commission_result.commission_rate > 0 THEN
        INSERT INTO policy_commissions (
            policy_id, 
            org_id,
            product_type, 
            grid_table, 
            grid_id,
            commission_rate, 
            reward_rate, 
            commission_amount,
            reward_amount, 
            total_amount, 
            created_by
        )
        VALUES (
            p_policy_id,
            policy_record.org_id,
            commission_result.product_type,
            commission_result.grid_table,
            commission_result.grid_id,
            commission_result.commission_rate,
            commission_result.reward_rate,
            (COALESCE(policy_record.premium_without_gst, 0) * commission_result.commission_rate / 100),
            (COALESCE(policy_record.premium_without_gst, 0) * commission_result.reward_rate / 100),
            (COALESCE(policy_record.premium_without_gst, 0) * commission_result.total_rate / 100),
            policy_record.created_by
        );
    END IF;
END;
$function$;

-- Update auto_calculate_commission trigger to also persist commission
CREATE OR REPLACE FUNCTION public.auto_calculate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  commission_result RECORD;
BEGIN
  -- Only calculate if policy status is active and has premium
  IF NEW.policy_status = 'active' AND COALESCE(NEW.premium_without_gst, 0) > 0 THEN
    -- Get commission calculation
    SELECT * INTO commission_result FROM public.get_commission(NEW.id);
    
    -- Store commission details in dynamic_details JSON if not already there
    IF commission_result.commission_rate IS NOT NULL AND commission_result.commission_rate > 0 THEN
      NEW.dynamic_details = COALESCE(NEW.dynamic_details, '{}'::jsonb) || 
        jsonb_build_object(
          'commission_rate', commission_result.commission_rate,
          'reward_rate', commission_result.reward_rate,
          'total_rate', commission_result.total_rate,
          'commission_amount', (COALESCE(NEW.premium_without_gst, 0) * commission_result.commission_rate / 100),
          'reward_amount', (COALESCE(NEW.premium_without_gst, 0) * commission_result.reward_rate / 100),
          'total_commission_amount', (COALESCE(NEW.premium_without_gst, 0) * commission_result.total_rate / 100),
          'commission_calculated_at', NOW()
        );
        
      -- Persist commission record
      PERFORM public.persist_policy_commission(NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;