-- Create customers table with all required fields
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  dob DATE,
  address JSONB, -- Store as {street, city, state, zipcode, country}
  phone TEXT,
  email TEXT,
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  
  -- Nominee details
  nominee_name TEXT,
  nominee_relationship TEXT,
  nominee_phone TEXT,
  nominee_email TEXT,
  
  -- Relationships
  agent_id UUID REFERENCES public.profiles(user_id),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(user_id)
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies based on role requirements
-- Admin/Employee: full CRUD within their organization
CREATE POLICY "Admins and employees can manage customers in their org" 
ON public.customers 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.org_id = customers.org_id
    AND profiles.role IN ('admin', 'employee')
  )
);

-- Agents: can create and read customers they're assigned to
CREATE POLICY "Agents can view their assigned customers" 
ON public.customers 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'agent'
    AND (customers.agent_id = auth.uid() OR profiles.org_id = customers.org_id)
  )
);

CREATE POLICY "Agents can create customers in their org" 
ON public.customers 
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'agent'
    AND profiles.org_id = customers.org_id
  )
);

-- Customers: can only view their own record
CREATE POLICY "Customers can view their own record" 
ON public.customers 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'customer'
    AND profiles.email = customers.email
  )
);

-- Super admins: can view all customers
CREATE POLICY "Super admins can manage all customers" 
ON public.customers 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_customers_org_id ON public.customers(org_id);
CREATE INDEX idx_customers_agent_id ON public.customers(agent_id);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);

-- Add update trigger
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();