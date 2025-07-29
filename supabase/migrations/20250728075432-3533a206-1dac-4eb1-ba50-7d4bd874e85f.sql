-- Add missing columns to branches table
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS manager_phone TEXT;

-- Update existing address data to address_line1 if needed
UPDATE public.branches 
SET address_line1 = address 
WHERE address IS NOT NULL AND address_line1 IS NULL;

-- Generate branch codes for existing branches without codes
UPDATE public.branches 
SET code = 'BR' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 4, '0')
WHERE code IS NULL;