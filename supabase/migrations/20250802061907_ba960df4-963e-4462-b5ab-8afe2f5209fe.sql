-- Enable RLS on tables that don't have it enabled (if not already enabled)
DO $$ 
BEGIN
  -- Enable RLS only if not already enabled
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'motor_policies') THEN
    ALTER TABLE public.motor_policies ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'policies') THEN
    ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'policies_new') THEN
    ALTER TABLE public.policies_new ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'policy_renewals') THEN
    ALTER TABLE public.policy_renewals ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add RLS policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'policies' AND policyname = 'Admin can manage policies'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin can manage policies" ON public.policies
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = ''admin''
      )
    )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'policies_new' AND policyname = 'Admin can manage policies_new'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin can manage policies_new" ON public.policies_new
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = ''admin''
      )
    )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'policy_renewals' AND policyname = 'Admin can manage policy renewals'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin can manage policy renewals" ON public.policy_renewals
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = ''admin''
      )
    )';
  END IF;
END $$;