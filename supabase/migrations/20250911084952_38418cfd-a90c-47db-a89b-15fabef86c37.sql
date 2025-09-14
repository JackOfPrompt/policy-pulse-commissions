-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public) VALUES ('policies', 'policies', true);

-- Create policies for policy document uploads
CREATE POLICY "Users can view policy documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'policies');

CREATE POLICY "Users can upload policy documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'policies');

CREATE POLICY "Users can update their policy documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'policies');

CREATE POLICY "Users can delete their policy documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'policies');