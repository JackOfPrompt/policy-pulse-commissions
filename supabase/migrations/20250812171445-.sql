-- Fix mdm_apply_policies to avoid IF NOT EXISTS and re-apply policies and triggers
CREATE OR REPLACE FUNCTION public.mdm_apply_policies(tbl regclass) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
  -- SELECT policy
  BEGIN
    EXECUTE format('CREATE POLICY "mdm_select_%s" ON %s FOR SELECT USING (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND (tenant_id IS NULL OR tenant_id = current_user_tenant_id())))', tbl, tbl);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  -- INSERT policy
  BEGIN
    EXECUTE format('CREATE POLICY "mdm_insert_%s" ON %s FOR INSERT WITH CHECK (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()))', tbl, tbl);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  -- UPDATE policy
  BEGIN
    EXECUTE format('CREATE POLICY "mdm_update_%s" ON %s FOR UPDATE USING (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id())) WITH CHECK (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()))', tbl, tbl);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  -- DELETE policy
  BEGIN
    EXECUTE format('CREATE POLICY "mdm_delete_%s" ON %s FOR DELETE USING (is_admin(auth.uid()) OR (is_tenant_admin(auth.uid()) AND tenant_id = current_user_tenant_id()))', tbl, tbl);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END; $$;

-- Re-apply triggers and policies to all MDM tables
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mdm_%' AND tablename <> 'mdm_audit_logs' LOOP
    PERFORM public.mdm_apply_policies(format('public.%s', r.tablename)::regclass);
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%s ON public.%s', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER set_updated_at_%s BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', r.tablename, r.tablename);
    EXECUTE format('DROP TRIGGER IF EXISTS bump_version_%s ON public.%s', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER bump_version_%s BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.mdm_bump_version()', r.tablename, r.tablename);
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON public.%s', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.mdm_write_audit()', r.tablename, r.tablename);
    EXECUTE format('DROP TRIGGER IF EXISTS set_user_%s ON public.%s', r.tablename, r.tablename);
    EXECUTE format('CREATE TRIGGER set_user_%s BEFORE INSERT OR UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.mdm_set_user_columns()', r.tablename, r.tablename);
  END LOOP;
END $$;