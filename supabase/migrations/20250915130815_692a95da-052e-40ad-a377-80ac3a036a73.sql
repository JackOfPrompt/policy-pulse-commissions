-- Create providers master table for normalized provider data
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,           -- canonical name (e.g., "Tata AIG General Insurance Co. Ltd.")
  short_name text,                     -- optional (e.g., "TATA AIG")
  code text UNIQUE,                    -- unique code for the provider
  aliases text[] DEFAULT '{}',         -- store variations like ["TATA-AIG", "Tata AIG Insurance"]
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add provider_id to policies table
ALTER TABLE policies ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);

-- Add provider_id and product_type_id to all payout grid tables
ALTER TABLE life_payout_grid ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);
ALTER TABLE motor_payout_grid ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id); 
ALTER TABLE health_payout_grid ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id);

-- Add product_type_id to payout grids (they should reference product_types table)
ALTER TABLE life_payout_grid ADD COLUMN IF NOT EXISTS product_type_id uuid REFERENCES product_types(id);
ALTER TABLE motor_payout_grid ADD COLUMN IF NOT EXISTS product_type_id uuid REFERENCES product_types(id);
ALTER TABLE health_payout_grid ADD COLUMN IF NOT EXISTS product_type_id uuid REFERENCES product_types(id);