-- Disable RLS on branches to allow unrestricted inserts/updates
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;

-- Drop all CHECK constraints on public.branches
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'branches'
      AND n.nspname = 'public'
      AND c.contype = 'c'  -- check constraints
  LOOP
    EXECUTE format('ALTER TABLE public.branches DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;