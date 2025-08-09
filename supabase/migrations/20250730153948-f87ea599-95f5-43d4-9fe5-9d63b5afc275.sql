-- Create commission slabs table for slab-based commission rules
CREATE TABLE IF NOT EXISTS public.commission_slabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.commission_rules(id) ON DELETE CASCADE,
  from_amount NUMERIC NOT NULL DEFAULT 0,
  to_amount NUMERIC,
  commission_rate NUMERIC,
  commission_amount NUMERIC,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission tier multipliers table
CREATE TABLE IF NOT EXISTS public.commission_tier_multipliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_id UUID NOT NULL REFERENCES public.agent_tiers(id) ON DELETE CASCADE,
  line_of_business TEXT NOT NULL,
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  bonus_rate NUMERIC DEFAULT 0,
  minimum_volume NUMERIC DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission campaigns table for time-bound special commissions
CREATE TABLE IF NOT EXISTS public.commission_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  insurer_id UUID REFERENCES public.insurance_providers(id),
  line_of_business TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'bonus',
  bonus_rate NUMERIC DEFAULT 0,
  bonus_amount NUMERIC DEFAULT 0,
  minimum_policies INTEGER DEFAULT 1,
  minimum_premium NUMERIC DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission reconciliation table for tracking actual vs calculated commissions
CREATE TABLE IF NOT EXISTS public.commission_reconciliation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies_new(id),
  commission_transaction_id UUID REFERENCES public.commissions(id),
  calculated_amount NUMERIC NOT NULL,
  received_amount NUMERIC,
  variance_amount NUMERIC GENERATED ALWAYS AS (received_amount - calculated_amount) STORED,
  reconciliation_status TEXT NOT NULL DEFAULT 'pending',
  reconciled_date DATE,
  reconciled_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commission_slabs_rule_id ON public.commission_slabs(rule_id);
CREATE INDEX IF NOT EXISTS idx_commission_tier_multipliers_tier_lob ON public.commission_tier_multipliers(tier_id, line_of_business);
CREATE INDEX IF NOT EXISTS idx_commission_campaigns_dates ON public.commission_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_commission_reconciliation_policy ON public.commission_reconciliation(policy_id);
CREATE INDEX IF NOT EXISTS idx_commission_reconciliation_status ON public.commission_reconciliation(reconciliation_status);

-- Add triggers for updated_at columns
CREATE TRIGGER update_commission_slabs_updated_at
  BEFORE UPDATE ON public.commission_slabs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_tier_multipliers_updated_at
  BEFORE UPDATE ON public.commission_tier_multipliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_campaigns_updated_at
  BEFORE UPDATE ON public.commission_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_reconciliation_updated_at
  BEFORE UPDATE ON public.commission_reconciliation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.commission_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tier_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_reconciliation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin can manage commission slabs" ON public.commission_slabs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin can manage tier multipliers" ON public.commission_tier_multipliers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin can manage campaigns" ON public.commission_campaigns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Admin can manage reconciliation" ON public.commission_reconciliation
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );