-- Create master_locations table
CREATE TABLE public.master_locations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    district text,
    division text,
    region text,
    block text,
    state text NOT NULL,
    country text NOT NULL DEFAULT 'India',
    pincode text NOT NULL,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- Create indexes for better performance
CREATE INDEX idx_master_locations_state ON public.master_locations(state);
CREATE INDEX idx_master_locations_pincode ON public.master_locations(pincode);
CREATE INDEX idx_master_locations_status ON public.master_locations(status);

-- Enable Row Level Security
ALTER TABLE public.master_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read master locations" 
ON public.master_locations 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage master locations" 
ON public.master_locations 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'system_admin'::app_role
));

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_master_locations_updated_at
    BEFORE UPDATE ON public.master_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();