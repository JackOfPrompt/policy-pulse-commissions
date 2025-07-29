-- Create sequence for payout_id first
CREATE SEQUENCE IF NOT EXISTS payout_id_seq START 1;

-- Create enum types for payout status and payment mode
CREATE TYPE payout_status AS ENUM ('Pending', 'Paid', 'Failed', 'On Hold');
CREATE TYPE payment_mode AS ENUM ('UPI', 'Bank Transfer', 'Cheque', 'Cash');

-- Create payout_transactions table
CREATE TABLE public.payout_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payout_id text NOT NULL UNIQUE DEFAULT 'PO-' || to_char(now(), 'YYYYMM') || '-' || LPAD(nextval('payout_id_seq')::text, 6, '0'),
    agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
    policy_id uuid REFERENCES public.policies_new(id) ON DELETE CASCADE,
    commission_rule_id uuid REFERENCES public.commission_rules(id) ON DELETE SET NULL,
    payout_amount numeric(15,2) NOT NULL CHECK (payout_amount >= 0),
    payout_date date NOT NULL,
    payout_status payout_status NOT NULL DEFAULT 'Pending',
    payment_mode payment_mode NOT NULL,
    processed_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
    remarks text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for role-based access
CREATE POLICY "Admin and Manager can view all payouts" 
ON public.payout_transactions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.employees e ON e.user_id = ur.user_id 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager')
    )
);

CREATE POLICY "Branch managers can view their branch payouts" 
ON public.payout_transactions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.employees e ON e.user_id = ur.user_id 
        JOIN public.agents a ON a.branch_id = e.branch_id
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'manager'
        AND a.id = agent_id
    )
);

CREATE POLICY "Admin and Manager can insert payouts" 
ON public.payout_transactions 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager')
    )
);

CREATE POLICY "Admin and Manager can update payouts" 
ON public.payout_transactions 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'manager')
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_payout_transactions_updated_at
    BEFORE UPDATE ON public.payout_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for payout reports with joined data
CREATE VIEW public.payout_reports AS
SELECT 
    pt.id,
    pt.payout_id,
    pt.payout_date,
    pt.payout_amount,
    pt.payout_status,
    pt.payment_mode,
    pt.remarks,
    pt.created_at,
    pt.updated_at,
    a.id as agent_id,
    a.name as agent_name,
    a.agent_code,
    at.name as agent_tier_name,
    b.name as branch_name,
    p.id as policy_id,
    p.policy_number,
    p.line_of_business,
    p.premium_amount,
    ip.name as product_name,
    ins.provider_name as insurer_name,
    e.name as processed_by_name,
    c.commission_amount
FROM public.payout_transactions pt
LEFT JOIN public.agents a ON pt.agent_id = a.id
LEFT JOIN public.agent_tiers at ON a.tier_id = at.id
LEFT JOIN public.branches b ON a.branch_id = b.id
LEFT JOIN public.policies_new p ON pt.policy_id = p.id
LEFT JOIN public.insurance_products ip ON p.product_id = ip.id
LEFT JOIN public.insurance_providers ins ON p.insurer_id = ins.id
LEFT JOIN public.employees e ON pt.processed_by = e.id
LEFT JOIN public.commissions c ON c.policy_id = p.id AND c.agent_id = a.id;