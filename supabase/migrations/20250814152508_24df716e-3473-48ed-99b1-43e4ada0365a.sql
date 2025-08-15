-- Create master_policy_types table
CREATE TABLE master_policy_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_type_name VARCHAR(255) NOT NULL,
    policy_type_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE master_policy_types ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read policy types" 
ON master_policy_types 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage policy types" 
ON master_policy_types 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'system_admin'::app_role
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_policy_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_policy_types_updated_at
BEFORE UPDATE ON master_policy_types
FOR EACH ROW
EXECUTE FUNCTION update_policy_types_updated_at();

-- Insert example records
INSERT INTO master_policy_types (policy_type_name, policy_type_description, is_active) VALUES
('Individual', 'Policy covering one person', true),
('Family Floater', 'Policy covering multiple family members', true),
('Group Policy', 'Policy issued to a group/organization', true);