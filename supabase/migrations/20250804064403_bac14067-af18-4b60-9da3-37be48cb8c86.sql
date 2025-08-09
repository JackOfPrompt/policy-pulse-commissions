-- Enable RLS on tables that don't have it yet (some may already have it)
ALTER TABLE policies_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create specific policies for dashboard views only if they don't exist
DO $$ 
BEGIN
    -- Policy for policies_new SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'policies_new' 
        AND policyname = 'Admin can view all policies for dashboard'
    ) THEN
        EXECUTE 'CREATE POLICY "Admin can view all policies for dashboard" 
        ON policies_new FOR SELECT 
        USING (EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = ''admin''
        ))';
    END IF;

    -- Policy for leads SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'leads' 
        AND policyname = 'Admin can view all leads for dashboard'
    ) THEN
        EXECUTE 'CREATE POLICY "Admin can view all leads for dashboard" 
        ON leads FOR SELECT 
        USING (EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = ''admin''
        ))';
    END IF;

    -- Policy for tasks SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'Admin can view all tasks for dashboard'
    ) THEN
        EXECUTE 'CREATE POLICY "Admin can view all tasks for dashboard" 
        ON tasks FOR SELECT 
        USING (EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = ''admin''
        ))';
    END IF;
END $$;