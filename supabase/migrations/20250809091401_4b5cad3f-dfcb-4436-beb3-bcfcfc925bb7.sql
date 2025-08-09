-- Add LOB mapping to providers via an array column
ALTER TABLE public.insurance_providers
ADD COLUMN IF NOT EXISTS lob_types text[];

-- Optional: comment for documentation
COMMENT ON COLUMN public.insurance_providers.lob_types IS 'List of Lines of Business (LOB) types associated with this provider, stored as uppercased text values';