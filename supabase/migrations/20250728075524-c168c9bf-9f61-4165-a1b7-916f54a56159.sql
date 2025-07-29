-- Add missing columns to branches table
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS code TEXT,
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

-- Generate branch codes for existing branches without codes using a sequence approach
DO $$
DECLARE
    branch_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR branch_record IN 
        SELECT id FROM public.branches WHERE code IS NULL ORDER BY created_at
    LOOP
        UPDATE public.branches 
        SET code = 'BR' || LPAD(counter::TEXT, 4, '0')
        WHERE id = branch_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Add unique constraint on code
ALTER TABLE public.branches ADD CONSTRAINT branches_code_unique UNIQUE (code);