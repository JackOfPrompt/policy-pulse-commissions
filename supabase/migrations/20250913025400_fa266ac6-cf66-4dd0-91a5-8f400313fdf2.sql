-- Allow 'superadmin' in profiles.role and create a default superadmin profile + org membership

-- 1) Fix profiles.role check constraint to include 'superadmin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin','admin','agent','employee','customer'));

-- 2) Ensure a GLOBAL organization exists and link the superadmin to it
DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; -- Superadmin UUID
BEGIN
  -- Create or fetch GLOBAL org
  SELECT id INTO v_org_id FROM public.organizations WHERE code = 'GLOBAL';
  IF v_org_id IS NULL THEN
    v_org_id := '2d1a4f75-1337-4c3a-9b3b-9d75a2c2d001'::uuid;
    INSERT INTO public.organizations (id, name, code)
    VALUES (v_org_id, 'Global', 'GLOBAL');
  END IF;

  -- Upsert profile for superadmin
  INSERT INTO public.profiles (id, full_name, email, role, primary_org_id, org_id)
  VALUES (v_user_id, 'Super Administrator', 'superadmin@insurtech.com', 'superadmin', v_org_id, v_org_id)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        primary_org_id = EXCLUDED.primary_org_id,
        org_id = EXCLUDED.org_id,
        updated_at = now();

  -- Ensure membership row exists
  IF NOT EXISTS (
    SELECT 1 FROM public.user_organizations WHERE user_id = v_user_id AND org_id = v_org_id
  ) THEN
    INSERT INTO public.user_organizations (user_id, org_id, role)
    VALUES (v_user_id, v_org_id, 'superadmin');
  END IF;
END $$;