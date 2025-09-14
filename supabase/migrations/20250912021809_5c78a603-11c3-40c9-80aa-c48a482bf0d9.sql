-- Create policy_training bucket for storing corrected training data
INSERT INTO storage.buckets (id, name, public) VALUES ('policy_training', 'policy_training', false);

-- Create RLS policies for policy_training bucket
CREATE POLICY "Authenticated users can upload training data" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'policy_training' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view training data" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'policy_training' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update training data" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'policy_training' AND auth.uid() IS NOT NULL);