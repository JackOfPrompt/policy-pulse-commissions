-- Remove unique constraint on pincode if it exists
-- First check if there's a unique constraint or index on pincode
DO $$ 
BEGIN
    -- Drop unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'master_locations' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%pincode%'
    ) THEN
        ALTER TABLE public.master_locations DROP CONSTRAINT IF EXISTS master_locations_pincode_key;
    END IF;
    
    -- Drop unique index if it exists
    DROP INDEX IF EXISTS master_locations_pincode_key;
    DROP INDEX IF EXISTS idx_master_locations_pincode_unique;
END $$;