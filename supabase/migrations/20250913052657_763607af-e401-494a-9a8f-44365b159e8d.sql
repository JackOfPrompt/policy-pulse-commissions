-- Add more comprehensive organization fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_type text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS employee_count text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS annual_revenue text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_address jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_person jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS compliance_info jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS api_settings jsonb;