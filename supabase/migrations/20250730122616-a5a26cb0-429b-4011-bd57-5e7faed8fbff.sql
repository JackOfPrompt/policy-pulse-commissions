-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('policy-documents', 'policy-documents', false);

-- Create policies for policy document uploads
CREATE POLICY "Users can view their policy documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'policy-documents' AND (
  -- Admin can see all
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR 
  -- Managers can see their branch documents
  EXISTS (SELECT 1 FROM user_roles ur 
    JOIN employees e ON e.user_id = ur.user_id 
    JOIN policies_new p ON p.branch_id = e.branch_id 
    WHERE ur.user_id = auth.uid() AND ur.role = 'manager' 
    AND (storage.foldername(name))[1] = p.policy_number)
  OR
  -- Users can see documents they uploaded
  owner = auth.uid()
));

CREATE POLICY "Users can upload policy documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'policy-documents' AND (
  -- Admin can upload
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR
  -- Managers can upload
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager')
  OR
  -- Regular users can upload
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'user')
));

CREATE POLICY "Users can update their policy documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'policy-documents' AND (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager'))
  OR owner = auth.uid()
));

CREATE POLICY "Users can delete their policy documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'policy-documents' AND (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager'))
  OR owner = auth.uid()
));

-- Create table for policy document metadata
CREATE TABLE public.policy_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('policy_copy', 'proposal_form', 'kyc_documents', 'medical_reports', 'inspection_report', 'endorsements', 'claims_documents', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
  validation_notes TEXT,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on policy_documents
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for policy_documents table
CREATE POLICY "Users can view policy documents based on role" 
ON public.policy_documents 
FOR SELECT 
USING (
  -- Admin can see all
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR 
  -- Managers can see their branch documents
  EXISTS (SELECT 1 FROM user_roles ur 
    JOIN employees e ON e.user_id = ur.user_id 
    JOIN policies_new p ON p.branch_id = e.branch_id 
    WHERE ur.user_id = auth.uid() AND ur.role = 'manager' 
    AND p.id = policy_documents.policy_id)
  OR
  -- Users can see documents they uploaded
  uploaded_by = auth.uid()
);

CREATE POLICY "Users can insert policy documents" 
ON public.policy_documents 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() AND
  (
    -- Admin can upload
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR
    -- Managers can upload
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager')
    OR
    -- Regular users can upload
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'user')
  )
);

CREATE POLICY "Users can update policy documents" 
ON public.policy_documents 
FOR UPDATE 
USING (
  -- Admin can update all
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR
  -- Managers can update documents
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'manager')
  OR
  -- Users can update documents they uploaded (but not validation fields)
  uploaded_by = auth.uid()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_policy_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_policy_documents_updated_at
BEFORE UPDATE ON public.policy_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_policy_documents_updated_at();

-- Add indexes for better performance
CREATE INDEX idx_policy_documents_policy_id ON public.policy_documents(policy_id);
CREATE INDEX idx_policy_documents_document_type ON public.policy_documents(document_type);
CREATE INDEX idx_policy_documents_validation_status ON public.policy_documents(validation_status);
CREATE INDEX idx_policy_documents_uploaded_by ON public.policy_documents(uploaded_by);