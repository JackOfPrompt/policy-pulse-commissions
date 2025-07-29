-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  branch_id UUID,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  id_proof_file_path TEXT,
  offer_letter_file_path TEXT,
  resume_file_path TEXT,
  has_login BOOLEAN DEFAULT false,
  username TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all employees" 
ON public.employees 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false);

-- Create storage policies for employee documents
CREATE POLICY "Admins can view employee documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload employee documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'employee-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update employee documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'employee-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete employee documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'employee-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();