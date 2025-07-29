-- Create upload_history table for tracking bulk uploads
CREATE TABLE public.upload_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploader_id UUID REFERENCES auth.users(id),
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  upload_datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_report_path TEXT,
  status TEXT NOT NULL DEFAULT 'Processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins
CREATE POLICY "Admins can manage all upload history" 
ON public.upload_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_upload_history_updated_at
BEFORE UPDATE ON public.upload_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();