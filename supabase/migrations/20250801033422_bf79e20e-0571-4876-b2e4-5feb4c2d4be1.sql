-- Enable RLS on all tables that have policies but RLS is disabled
ALTER TABLE provider_line_of_business ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for provider_line_of_business if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'provider_line_of_business' 
        AND policyname = 'Admin can manage provider LOB mappings'
    ) THEN
        CREATE POLICY "Admin can manage provider LOB mappings" 
        ON provider_line_of_business 
        FOR ALL 
        USING (EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        ));
    END IF;
END $$;

-- Create RLS policies for upload_error_logs if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'upload_error_logs' 
        AND policyname = 'Admin can manage upload error logs'
    ) THEN
        CREATE POLICY "Admin can manage upload error logs" 
        ON upload_error_logs 
        FOR ALL 
        USING (EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        ));
    END IF;
END $$;