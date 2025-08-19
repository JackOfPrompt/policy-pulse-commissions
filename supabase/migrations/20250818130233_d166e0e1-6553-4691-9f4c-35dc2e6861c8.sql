-- Policies and related schema for Policy Management (UUID-based, multi-tenant)
-- Safe defaults, RLS policies aligned with existing profiles/roles model

-- 1) Core policies table
CREATE TABLE IF NOT EXISTS public.policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  policy_number TEXT UNIQUE NOT NULL,
  holder_name TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('New','Renewal','Ported','Converted')),
  channel_type TEXT NOT NULL CHECK (channel_type IN ('POSP','MISP','Bancassurance','Direct','Online','Broker')),
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  premium_amount NUMERIC(15,2) NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('Fixed','Slab','Custom')),
  commission_value NUMERIC(8,2),
  revenue_amount NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Expired','Cancelled','Renewed')),
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_policies_tenant ON public.policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policies_product ON public.policies(product_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_issue_expiry ON public.policies(issue_date, expiry_date);

-- Update timestamp trigger
CREATE TRIGGER update_policies_updated_at
BEFORE UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- RLS: Tenant admins manage, tenant users view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'policies' AND policyname = 'Tenant admins can manage policies'
  ) THEN
    CREATE POLICY "Tenant admins can manage policies"
    ON public.policies
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = public.policies.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = public.policies.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'policies' AND policyname = 'Tenant users can view policies'
  ) THEN
    CREATE POLICY "Tenant users can view policies"
    ON public.policies
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = public.policies.tenant_id)
      )
    );
  END IF;
END$$;

-- 2) LOB-specific tables
CREATE TABLE IF NOT EXISTS public.policy_health_details (
  policy_id UUID PRIMARY KEY REFERENCES public.policies(policy_id) ON DELETE CASCADE,
  sum_insured NUMERIC(15,2) NOT NULL,
  insured_persons INT NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('Individual','Family Floater','Group')),
  pre_existing_conditions TEXT[],
  hospital_network TEXT CHECK (hospital_network IN ('In-Network','Out-of-Network')),
  room_rent_limit TEXT,
  co_payment_percent NUMERIC(5,2)
);

CREATE TABLE IF NOT EXISTS public.policy_motor_details (
  policy_id UUID PRIMARY KEY REFERENCES public.policies(policy_id) ON DELETE CASCADE,
  vehicle_type TEXT CHECK (vehicle_type IN ('Car','Two-Wheeler','Commercial Vehicle')),
  vehicle_number TEXT,
  engine_number TEXT,
  chassis_number TEXT,
  make_model TEXT,
  manufacture_year INT,
  fuel_type TEXT CHECK (fuel_type IN ('Petrol','Diesel','CNG','Electric','Hybrid')),
  coverage_type TEXT CHECK (coverage_type IN ('Third Party','Comprehensive','Own Damage + TP','Zero Depreciation')),
  addons TEXT[]
);

CREATE TABLE IF NOT EXISTS public.policy_life_details (
  policy_id UUID PRIMARY KEY REFERENCES public.policies(policy_id) ON DELETE CASCADE,
  sum_assured NUMERIC(15,2),
  policy_term INT,
  maturity_date DATE,
  nominee_name TEXT,
  nominee_relation TEXT,
  premium_frequency TEXT CHECK (premium_frequency IN ('Monthly','Quarterly','Half-Yearly','Yearly','Single Pay')),
  riders TEXT[]
);

-- Enable RLS on detail tables
ALTER TABLE public.policy_health_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_motor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_life_details ENABLE ROW LEVEL SECURITY;

-- RLS for detail tables via join to policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_health_details' AND policyname='Tenant users can view health details'
  ) THEN
    CREATE POLICY "Tenant users can view health details"
    ON public.policy_health_details
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_health_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_health_details' AND policyname='Tenant admins manage health details'
  ) THEN
    CREATE POLICY "Tenant admins manage health details"
    ON public.policy_health_details
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_health_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_health_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_motor_details' AND policyname='Tenant users can view motor details'
  ) THEN
    CREATE POLICY "Tenant users can view motor details"
    ON public.policy_motor_details
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_motor_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_motor_details' AND policyname='Tenant admins manage motor details'
  ) THEN
    CREATE POLICY "Tenant admins manage motor details"
    ON public.policy_motor_details
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_motor_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_motor_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_life_details' AND policyname='Tenant users can view life details'
  ) THEN
    CREATE POLICY "Tenant users can view life details"
    ON public.policy_life_details
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_life_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_life_details' AND policyname='Tenant admins manage life details'
  ) THEN
    CREATE POLICY "Tenant admins manage life details"
    ON public.policy_life_details
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_life_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_life_details.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;
END$$;

-- 3) Policy renewals
CREATE TABLE IF NOT EXISTS public.policy_renewals (
  renewal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.policies(policy_id) ON DELETE CASCADE,
  old_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  renewal_premium NUMERIC(15,2),
  renewed_by UUID REFERENCES public.profiles(user_id),
  renewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_renewals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_renewals' AND policyname='Tenant users can view renewals'
  ) THEN
    CREATE POLICY "Tenant users can view renewals"
    ON public.policy_renewals
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_renewals.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_renewals' AND policyname='Tenant admins manage renewals'
  ) THEN
    CREATE POLICY "Tenant admins manage renewals"
    ON public.policy_renewals
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_renewals.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_renewals.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;
END$$;

-- 4) Policy documents metadata (file metadata; files in Storage bucket)
CREATE TABLE IF NOT EXISTS public.policy_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.policies(policy_id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(user_id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_documents_policy ON public.policy_documents(policy_id);
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_documents' AND policyname='Tenant users can view policy docs metadata'
  ) THEN
    CREATE POLICY "Tenant users can view policy docs metadata"
    ON public.policy_documents
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_documents.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_documents' AND policyname='Tenant admins manage policy docs metadata'
  ) THEN
    CREATE POLICY "Tenant admins manage policy docs metadata"
    ON public.policy_documents
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_documents.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_documents.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;
END$$;

-- 5) Bulk upload staging
CREATE TABLE IF NOT EXISTS public.policy_bulk_imports (
  import_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(user_id),
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Validated','Imported','Failed'))
);

CREATE TABLE IF NOT EXISTS public.policy_bulk_import_rows (
  row_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES public.policy_bulk_imports(import_id) ON DELETE CASCADE,
  row_number INT,
  data JSONB,
  validation_status TEXT NOT NULL DEFAULT 'Pending' CHECK (validation_status IN ('Pending','Valid','Invalid')),
  validation_errors TEXT[]
);

ALTER TABLE public.policy_bulk_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_bulk_import_rows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_bulk_imports' AND policyname='Tenant admins manage bulk imports'
  ) THEN
    CREATE POLICY "Tenant admins manage bulk imports"
    ON public.policy_bulk_imports
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = public.policy_bulk_imports.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = public.policy_bulk_imports.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_bulk_imports' AND policyname='Tenant users can view bulk imports'
  ) THEN
    CREATE POLICY "Tenant users can view bulk imports"
    ON public.policy_bulk_imports
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = public.policy_bulk_imports.tenant_id)
      )
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_bulk_import_rows' AND policyname='Tenant admins manage bulk import rows'
  ) THEN
    CREATE POLICY "Tenant admins manage bulk import rows"
    ON public.policy_bulk_import_rows
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.policy_bulk_imports bi
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE bi.import_id = public.policy_bulk_import_rows.import_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = bi.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.policy_bulk_imports bi
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE bi.import_id = public.policy_bulk_import_rows.import_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = bi.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_bulk_import_rows' AND policyname='Tenant users can view bulk import rows'
  ) THEN
    CREATE POLICY "Tenant users can view bulk import rows"
    ON public.policy_bulk_import_rows
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.policy_bulk_imports bi
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE bi.import_id = public.policy_bulk_import_rows.import_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = bi.tenant_id)
      )
    );
  END IF;
END$$;

-- 6) Policy commissions (optional)
CREATE TABLE IF NOT EXISTS public.policy_commissions (
  commission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.policies(policy_id) ON DELETE CASCADE,
  agent_id BIGINT REFERENCES public.agents(agent_id),
  commission_type TEXT,
  commission_value NUMERIC(8,2),
  commission_amount NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_commissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_commissions' AND policyname='Tenant users can view policy commissions'
  ) THEN
    CREATE POLICY "Tenant users can view policy commissions"
    ON public.policy_commissions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_commissions.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_commissions' AND policyname='Tenant admins manage policy commissions'
  ) THEN
    CREATE POLICY "Tenant admins manage policy commissions"
    ON public.policy_commissions
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_commissions.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.policies po
        JOIN public.profiles p ON (p.user_id = auth.uid())
        WHERE po.policy_id = public.policy_commissions.policy_id
          AND (p.role = 'system_admin'::app_role OR p.tenant_id = po.tenant_id)
          AND p.role = ANY (ARRAY['tenant_admin'::app_role,'system_admin'::app_role])
      )
    );
  END IF;
END$$;

-- 7) Storage bucket for policy documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy_documents','policy_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for policy documents (path convention: tenantId/policyId/filename)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Policy docs: tenant users can read'
  ) THEN
    CREATE POLICY "Policy docs: tenant users can read"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'policy_documents'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id::text = (storage.foldername(name))[1])
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Policy docs: tenant users can upload'
  ) THEN
    CREATE POLICY "Policy docs: tenant users can upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'policy_documents'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id::text = (storage.foldername(name))[1])
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Policy docs: tenant users can modify'
  ) THEN
    CREATE POLICY "Policy docs: tenant users can modify"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'policy_documents'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id::text = (storage.foldername(name))[1])
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Policy docs: tenant users can delete'
  ) THEN
    CREATE POLICY "Policy docs: tenant users can delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'policy_documents'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
          AND (p.role = 'system_admin'::app_role OR p.tenant_id::text = (storage.foldername(name))[1])
      )
    );
  END IF;
END$$;
