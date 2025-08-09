-- Create master_uin_codes table
CREATE TABLE public.master_uin_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uin_code TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  insurer_name TEXT NOT NULL,
  line_of_business TEXT NOT NULL,
  product_type TEXT,
  effective_date DATE,
  expiry_date DATE,
  filing_date DATE,
  approval_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn')),
  source_file_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  last_updated_by UUID
);

-- Enable RLS
ALTER TABLE public.master_uin_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage master UIN codes" 
ON public.master_uin_codes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "All can view active UIN codes" 
ON public.master_uin_codes 
FOR SELECT 
USING (is_active = true);

-- Add triggers
CREATE TRIGGER update_master_uin_codes_updated_at
  BEFORE UPDATE ON public.master_uin_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_master_data_updated_at();

CREATE TRIGGER audit_master_uin_codes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.master_uin_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_master_data_changes();

-- Create index for better performance
CREATE INDEX idx_master_uin_codes_uin_code ON public.master_uin_codes(uin_code);
CREATE INDEX idx_master_uin_codes_insurer_name ON public.master_uin_codes(insurer_name);
CREATE INDEX idx_master_uin_codes_line_of_business ON public.master_uin_codes(line_of_business);

-- Update insurance_providers table to dynamically link with UIN codes
-- Add UIN code mapping to providers if not exists
ALTER TABLE public.insurance_providers 
ADD COLUMN IF NOT EXISTS uin_codes TEXT[],
ADD COLUMN IF NOT EXISTS auto_sync_uin BOOLEAN DEFAULT true;