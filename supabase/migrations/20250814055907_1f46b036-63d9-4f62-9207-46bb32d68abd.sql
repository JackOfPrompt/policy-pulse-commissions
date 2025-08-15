-- Drop ALL existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_credentials', 'profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- Create simple, non-circular policies
CREATE POLICY "Allow public read for authentication"
ON public.user_credentials
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to read profiles"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);