-- Create demo users with proper roles and organizations
-- First, get organization IDs for reference
DO $$
DECLARE
    global_org_id UUID;
    demo_org_id UUID;
BEGIN
    -- Get organization IDs
    SELECT id INTO global_org_id FROM public.organizations WHERE name = 'Global Corp';
    SELECT id INTO demo_org_id FROM public.organizations WHERE name = 'Demo Insurance LLC';

    -- Insert demo profiles with specific roles
    INSERT INTO public.profiles (user_id, email, first_name, last_name, role, org_id) VALUES
        ('00000000-0000-0000-0000-000000000001', 'superadmin@test.com', 'Super', 'Admin', 'super_admin', global_org_id),
        ('00000000-0000-0000-0000-000000000002', 'admin@test.com', 'Admin', 'User', 'admin', demo_org_id),
        ('00000000-0000-0000-0000-000000000003', 'employee@test.com', 'Employee', 'User', 'employee', demo_org_id),
        ('00000000-0000-0000-0000-000000000004', 'agent@test.com', 'Agent', 'User', 'agent', demo_org_id),
        ('00000000-0000-0000-0000-000000000005', 'customer@test.com', 'Customer', 'User', 'customer', demo_org_id)
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        org_id = EXCLUDED.org_id,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name;

    -- Insert user-organization relationships
    INSERT INTO public.user_organizations (user_id, org_id, role) VALUES
        ('00000000-0000-0000-0000-000000000001', global_org_id, 'super_admin'),
        ('00000000-0000-0000-0000-000000000002', demo_org_id, 'admin'),
        ('00000000-0000-0000-0000-000000000003', demo_org_id, 'employee'),
        ('00000000-0000-0000-0000-000000000004', demo_org_id, 'agent'),
        ('00000000-0000-0000-0000-000000000005', demo_org_id, 'customer')
    ON CONFLICT (user_id, org_id) DO UPDATE SET
        role = EXCLUDED.role;
END $$;