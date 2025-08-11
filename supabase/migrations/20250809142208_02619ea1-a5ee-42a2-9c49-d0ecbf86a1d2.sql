-- Create master features and mapping for subscription plans (fixed and hardened)

-- 1) Master table for plan features
CREATE TABLE IF NOT EXISTS public.plan_features (
  feature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and policies for plan_features
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read plan_features" ON public.plan_features FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Write plan_features (admin)" ON public.plan_features FOR INSERT WITH CHECK (public.is_current_user_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Update plan_features (admin)" ON public.plan_features FOR UPDATE USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Delete plan_features (admin)" ON public.plan_features FOR DELETE USING (public.is_current_user_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Mapping table between plans and features
CREATE TABLE IF NOT EXISTS public.subscription_plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  feature_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_id),
  CONSTRAINT fk_plan_features_plan FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(plan_id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_features_feature FOREIGN KEY (feature_id) REFERENCES public.plan_features(feature_id) ON DELETE CASCADE
);

ALTER TABLE public.subscription_plan_features ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read plan feature map" ON public.subscription_plan_features FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Write plan feature map (admin)" ON public.subscription_plan_features FOR INSERT WITH CHECK (public.is_current_user_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Update plan feature map (admin)" ON public.subscription_plan_features FOR UPDATE USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Delete plan feature map (admin)" ON public.subscription_plan_features FOR DELETE USING (public.is_current_user_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Ensure subscription_plans has plan_code column
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t 
    WHERE t.table_schema='public' AND t.table_name='subscription_plans'
  ) THEN
    EXECUTE 'ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS plan_code text';
  END IF;
END $$;

-- 4) Sequence for plan codes
DO $$ BEGIN
  PERFORM 1 FROM pg_class WHERE relname = 'subscription_plan_code_seq' AND relnamespace = 'public'::regnamespace;
  IF NOT FOUND THEN
    CREATE SEQUENCE public.subscription_plan_code_seq START 1;
  END IF;
END $$;

-- 5) Function to generate plan code
CREATE OR REPLACE FUNCTION public.generate_subscription_plan_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  next_no BIGINT;
BEGIN
  next_no := nextval('public.subscription_plan_code_seq');
  RETURN 'PLAN-' || lpad(next_no::text, 5, '0');
END;
$$;

-- 6) Helper trigger function (define BEFORE creating trigger)
CREATE OR REPLACE FUNCTION public.set_plan_code_if_missing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.plan_code IS NULL OR btrim(NEW.plan_code) = '' THEN
    NEW.plan_code := public.generate_subscription_plan_code();
  END IF;
  RETURN NEW;
END;
$$;

-- 7) Unique index on subscription_plans.plan_code (if table exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t 
    WHERE t.table_schema='public' AND t.table_name='subscription_plans'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX subscription_plans_plan_code_key ON public.subscription_plans (plan_code);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- 8) Create trigger AFTER function exists (guard if table exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t 
    WHERE t.table_schema='public' AND t.table_name='subscription_plans'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_set_plan_code ON public.subscription_plans';
    EXECUTE 'CREATE TRIGGER trg_set_plan_code BEFORE INSERT ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.set_plan_code_if_missing()';
  END IF;
END $$;