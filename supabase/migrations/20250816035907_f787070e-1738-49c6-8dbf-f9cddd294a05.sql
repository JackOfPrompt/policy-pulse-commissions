-- Create tenant_employee_salaries table for salary history
CREATE TABLE public.tenant_employee_salaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  bonus numeric(12,2) DEFAULT 0,
  total_salary numeric(12,2) GENERATED ALWAYS AS (base_salary + COALESCE(bonus, 0)) STORED,
  reason text,
  revised_by uuid,
  status text DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_employee_salaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tenant admins can manage employee salaries"
ON public.tenant_employee_salaries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.tenant_id = tenant_employee_salaries.tenant_id
    AND profiles.role IN ('tenant_admin', 'system_admin')
  )
);

CREATE POLICY "Users can view salaries in their tenant"
ON public.tenant_employee_salaries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.tenant_id = tenant_employee_salaries.tenant_id
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_employee_salaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_salaries_updated_at
BEFORE UPDATE ON public.tenant_employee_salaries
FOR EACH ROW
EXECUTE FUNCTION public.update_employee_salaries_updated_at();

-- Create index for performance
CREATE INDEX idx_tenant_employee_salaries_employee_id ON public.tenant_employee_salaries(employee_id);
CREATE INDEX idx_tenant_employee_salaries_tenant_id ON public.tenant_employee_salaries(tenant_id);
CREATE INDEX idx_tenant_employee_salaries_effective_date ON public.tenant_employee_salaries(effective_date DESC);