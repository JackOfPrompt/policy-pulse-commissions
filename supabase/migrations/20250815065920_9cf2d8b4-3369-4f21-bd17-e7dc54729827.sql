-- Add missing fields to tenant_organizations table
ALTER TABLE public.tenant_organizations 
ADD COLUMN IF NOT EXISTS tenant_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended'));

-- Update existing records to have a status if they don't have one
UPDATE public.tenant_organizations 
SET status = CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END
WHERE status IS NULL;

-- Create an index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_tenant_organizations_status ON public.tenant_organizations(status);
CREATE INDEX IF NOT EXISTS idx_tenant_organizations_tenant_code ON public.tenant_organizations(tenant_code);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_tenant_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_organizations_updated_at
    BEFORE UPDATE ON public.tenant_organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tenant_organizations_updated_at();