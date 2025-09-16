-- Add missing columns to existing providers table
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS short_name text,
ADD COLUMN IF NOT EXISTS aliases text[] DEFAULT '{}';

-- Insert sample providers data with correct column names
INSERT INTO providers (name, short_name, code, aliases, provider_type) VALUES
('Tata AIG General Insurance Co. Ltd.', 'Tata AIG', 'TATA_AIG', '["TATA AIG", "Tata AIG General Insurance", "TATA-AIG"]', 'insurer'),
('HDFC Life Insurance Co. Ltd.', 'HDFC Life', 'HDFC_LIFE', '["HDFC Life", "HDFC LIFE", "HDFC Life Insurance"]', 'insurer'),
('ICICI Lombard General Insurance Co. Ltd.', 'ICICI Lombard', 'ICICI_LOMBARD', '["ICICI Lombard", "ICICI LOMBARD", "ICICI Lombard General Insurance"]', 'insurer'),
('Bajaj Allianz General Insurance Co. Ltd.', 'Bajaj Allianz', 'BAJAJ_ALLIANZ', '["Bajaj Allianz", "BAJAJ ALLIANZ", "Bajaj Allianz General Insurance"]', 'insurer'),
('Star Health and Allied Insurance Co. Ltd.', 'Star Health', 'STAR_HEALTH', '["Star Health", "STAR HEALTH", "Star Health Insurance"]', 'insurer'),
('New India Assurance Co. Ltd.', 'New India Assurance', 'NEW_INDIA', '["New India Assurance", "NEW INDIA", "New India Insurance"]', 'insurer'),
('Life Insurance Corporation of India', 'LIC', 'LIC', '["LIC", "Life Insurance Corporation", "LIC of India"]', 'insurer')
ON CONFLICT (name) DO UPDATE SET
  short_name = EXCLUDED.short_name,
  aliases = EXCLUDED.aliases,
  provider_type = EXCLUDED.provider_type;