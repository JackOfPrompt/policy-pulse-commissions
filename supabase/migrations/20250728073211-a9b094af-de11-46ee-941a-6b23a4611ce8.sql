-- Update agents table with additional fields for agent management
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS agent_type TEXT CHECK (agent_type IN ('POSP', 'MISP')),
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
ADD COLUMN IF NOT EXISTS irdai_certified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS irdai_cert_number TEXT,
ADD COLUMN IF NOT EXISTS pan_file_path TEXT,
ADD COLUMN IF NOT EXISTS aadhar_file_path TEXT,
ADD COLUMN IF NOT EXISTS irdai_file_path TEXT,
ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;

-- Update existing status check constraint
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_status_check;
ALTER TABLE public.agents ADD CONSTRAINT agents_status_check CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Terminated'));

-- Create storage bucket for agent documents
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-documents', 'agent-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for agent documents
CREATE POLICY "Admins can upload agent documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'agent-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view agent documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'agent-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update agent documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'agent-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete agent documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'agent-documents' AND public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_agent_type ON public.agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_joining_date ON public.agents(joining_date);
CREATE INDEX IF NOT EXISTS idx_agents_irdai_certified ON public.agents(irdai_certified);