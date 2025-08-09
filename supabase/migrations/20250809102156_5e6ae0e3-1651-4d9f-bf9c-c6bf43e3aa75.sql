-- Bulk update: master_uin_codes status from pending to active for all insurers
-- Safe, idempotent: runs only where status is currently pending (case-insensitive)

-- 1) Preview count (for logs)
DO $$
DECLARE
  pending_count integer;
BEGIN
  SELECT COUNT(*) INTO pending_count FROM public.master_uin_codes WHERE lower(status) = 'pending';
  RAISE NOTICE 'Pending UIN code records to update: %', pending_count;
END $$;

-- 2) Perform update
UPDATE public.master_uin_codes
SET 
  status = 'active',
  is_active = true,
  updated_at = now()
WHERE lower(status) = 'pending';

-- 3) Post-update count (for logs)
DO $$
DECLARE
  active_count integer;
BEGIN
  SELECT COUNT(*) INTO active_count FROM public.master_uin_codes WHERE lower(status) = 'active';
  RAISE NOTICE 'Total active UIN code records after update: %', active_count;
END $$;