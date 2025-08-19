-- 1) Bridge table to map legacy BIGINT policy ids to new UUID policies
CREATE TABLE IF NOT EXISTS public.policy_map (
  legacy_policy_id BIGINT PRIMARY KEY,
  policy_uuid UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT policy_map_policy_uuid_fkey FOREIGN KEY (policy_uuid)
    REFERENCES public.policies(policy_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT policy_map_policy_uuid_unique UNIQUE(policy_uuid)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_policy_map_legacy ON public.policy_map(legacy_policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_map_uuid ON public.policy_map(policy_uuid);

-- Enable RLS
ALTER TABLE public.policy_map ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (avoid duplicates)
DROP POLICY IF EXISTS policy_map_select ON public.policy_map;
DROP POLICY IF EXISTS policy_map_insert ON public.policy_map;
DROP POLICY IF EXISTS policy_map_update ON public.policy_map;
DROP POLICY IF EXISTS policy_map_delete ON public.policy_map;

-- Create policies
CREATE POLICY policy_map_select
ON public.policy_map
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.policies p
    JOIN public.profiles pr ON pr.user_id = auth.uid()
    WHERE p.policy_id = policy_map.policy_uuid
      AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
  )
);

CREATE POLICY policy_map_insert
ON public.policy_map
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.policies p
    JOIN public.profiles pr ON pr.user_id = auth.uid()
    WHERE p.policy_id = policy_map.policy_uuid
      AND pr.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
  )
);

CREATE POLICY policy_map_update
ON public.policy_map
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.policies p
    JOIN public.profiles pr ON pr.user_id = auth.uid()
    WHERE p.policy_id = policy_map.policy_uuid
      AND pr.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.policies p
    JOIN public.profiles pr ON pr.user_id = auth.uid()
    WHERE p.policy_id = policy_map.policy_uuid
      AND pr.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
  )
);

CREATE POLICY policy_map_delete
ON public.policy_map
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.policies p
    JOIN public.profiles pr ON pr.user_id = auth.uid()
    WHERE p.policy_id = policy_map.policy_uuid
      AND pr.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      AND (pr.role = 'system_admin'::app_role OR pr.tenant_id = p.tenant_id)
  )
);