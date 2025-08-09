-- 1) Ensure trigger to auto-provision tenant on new user signup exists
-- Create trigger on auth.users to call public.auto_provision_tenant_on_user()
-- Note: We do not alter auth schema structures, only add trigger via SECURITY DEFINER function already present

-- Safety: drop trigger if exists to avoid duplicates
DROP TRIGGER IF EXISTS trg_auto_provision_tenant ON auth.users;

-- Create trigger invoking existing function
CREATE TRIGGER trg_auto_provision_tenant
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_provision_tenant_on_user();
