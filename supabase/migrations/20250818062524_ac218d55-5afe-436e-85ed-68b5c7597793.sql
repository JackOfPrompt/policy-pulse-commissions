-- Create agents table with UUID tenant_id to match profiles table
CREATE TABLE public.agents (
    agent_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tenant_id UUID NOT NULL,
    agent_type VARCHAR(10) CHECK (agent_type IN ('POSP','MISP')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING','APPROVED','REJECTED','EXAM_PENDING','EXAM_PASSED')),
    created_by UUID, -- Reference to profiles.user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agent_exams table
CREATE TABLE public.agent_exams (
    exam_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    agent_id BIGINT NOT NULL,
    exam_date TIMESTAMP,
    score INTEGER,
    status VARCHAR(20) CHECK (status IN ('ASSIGNED','PASSED','FAILED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES public.agents(agent_id) ON DELETE CASCADE
);

-- Create agent_approvals table
CREATE TABLE public.agent_approvals (
    approval_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    agent_id BIGINT NOT NULL,
    approver_id UUID NOT NULL, -- Reference to profiles.user_id
    level INTEGER NOT NULL,
    decision VARCHAR(20) CHECK (decision IN ('PENDING','APPROVED','REJECTED')),
    decision_date TIMESTAMP,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES public.agents(agent_id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agents
CREATE POLICY "Tenant users can view their agents" 
ON public.agents 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.tenant_id = agents.tenant_id OR profiles.role = 'system_admin'::app_role)
));

CREATE POLICY "Tenant admins can manage their agents" 
ON public.agents 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.tenant_id = agents.tenant_id OR profiles.role = 'system_admin'::app_role)
    AND profiles.role = ANY(ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
));

-- Create RLS policies for agent_exams
CREATE POLICY "Users can view exams for their tenant agents" 
ON public.agent_exams 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.profiles p ON (p.tenant_id = a.tenant_id OR p.role = 'system_admin'::app_role)
    WHERE a.agent_id = agent_exams.agent_id 
    AND p.user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage agent exams" 
ON public.agent_exams 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.profiles p ON (p.tenant_id = a.tenant_id OR p.role = 'system_admin'::app_role)
    WHERE a.agent_id = agent_exams.agent_id 
    AND p.user_id = auth.uid()
    AND p.role = ANY(ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
));

-- Create RLS policies for agent_approvals
CREATE POLICY "Users can view approvals for their tenant agents" 
ON public.agent_approvals 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.profiles p ON (p.tenant_id = a.tenant_id OR p.role = 'system_admin'::app_role)
    WHERE a.agent_id = agent_approvals.agent_id 
    AND p.user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage agent approvals" 
ON public.agent_approvals 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.agents a
    JOIN public.profiles p ON (p.tenant_id = a.tenant_id OR p.role = 'system_admin'::app_role)
    WHERE a.agent_id = agent_approvals.agent_id 
    AND p.user_id = auth.uid()
    AND p.role = ANY(ARRAY['tenant_admin'::app_role, 'system_admin'::app_role])
));

-- Create trigger for updated_at on agents
CREATE OR REPLACE FUNCTION public.update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agents_updated_at();