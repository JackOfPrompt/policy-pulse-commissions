-- Add policy to allow reading credentials for authentication
CREATE POLICY "Allow reading credentials for authentication" 
ON user_credentials 
FOR SELECT 
TO anon
USING (true);