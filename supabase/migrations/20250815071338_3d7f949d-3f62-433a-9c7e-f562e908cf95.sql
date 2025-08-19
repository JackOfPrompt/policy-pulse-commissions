-- Create subscription management tables

-- Plans table with comprehensive pricing and configuration
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  billing_cycles TEXT[] NOT NULL DEFAULT ARRAY['MONTHLY'], -- MONTHLY, QUARTERLY, ANNUAL, CUSTOM
  base_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  trial_days INTEGER DEFAULT 0,
  seat_config JSONB DEFAULT '{"included": 1, "extra_price": 0}'::jsonb,
  usage_config JSONB DEFAULT '{"enabled": false}'::jsonb,
  tax_config JSONB DEFAULT '{"gst_percent": 18, "price_includes_tax": false}'::jsonb,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add-ons table for additional features
CREATE TABLE public.subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_code TEXT NOT NULL UNIQUE,
  addon_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  addon_type TEXT NOT NULL DEFAULT 'flat' CHECK (addon_type IN ('flat', 'seat', 'usage')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons and promotions
CREATE TABLE public.subscription_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL UNIQUE,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percent', 'flat')),
  value NUMERIC NOT NULL,
  applies_to JSONB DEFAULT '{"plans": [], "addons": []}'::jsonb,
  max_redemptions INTEGER,
  per_tenant_limit INTEGER DEFAULT 1,
  valid_from DATE,
  valid_to DATE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.tenant_subscriptions_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  quantity_seats INTEGER NOT NULL DEFAULT 1,
  autopay BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription add-ons mapping
CREATE TABLE public.subscription_addon_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.tenant_subscriptions_new(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.subscription_addons(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage tracking for metered billing
CREATE TABLE public.subscription_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.tenant_subscriptions_new(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_organizations(id),
  subscription_id UUID REFERENCES public.tenant_subscriptions_new(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'unpaid', 'void')),
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  amount_due NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  hosted_payment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice line items
CREATE TABLE public.subscription_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.subscription_invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('plan', 'addon', 'proration', 'tax', 'discount')),
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_amount NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment methods (tokenized)
CREATE TABLE public.tenant_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenant_organizations(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL CHECK (gateway IN ('razorpay', 'stripe')),
  payment_method_id TEXT NOT NULL, -- Gateway's payment method ID
  payment_type TEXT NOT NULL CHECK (payment_type IN ('card', 'upi', 'netbanking')),
  last4 TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.subscription_invoices(id),
  payment_method_id UUID REFERENCES public.tenant_payment_methods(id),
  gateway TEXT NOT NULL CHECK (gateway IN ('razorpay', 'stripe')),
  gateway_payment_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupon redemptions tracking
CREATE TABLE public.subscription_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.subscription_coupons(id),
  tenant_id UUID NOT NULL REFERENCES public.tenant_organizations(id),
  subscription_id UUID REFERENCES public.tenant_subscriptions_new(id),
  discount_amount NUMERIC NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions_new(tenant_id);
CREATE INDEX idx_tenant_subscriptions_status ON public.tenant_subscriptions_new(status);
CREATE INDEX idx_subscription_invoices_tenant_id ON public.subscription_invoices(tenant_id);
CREATE INDEX idx_subscription_invoices_status ON public.subscription_invoices(status);
CREATE INDEX idx_subscription_usage_records_subscription_metric ON public.subscription_usage_records(subscription_id, metric_code);
CREATE INDEX idx_subscription_payments_invoice_id ON public.subscription_payments(invoice_id);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_addon_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for System Admins
CREATE POLICY "System admins can manage all subscription plans" 
ON public.subscription_plans FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage all subscription addons" 
ON public.subscription_addons FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage all subscription coupons" 
ON public.subscription_coupons FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

-- RLS Policies for Tenant Admins (can view their own tenant's subscription data)
CREATE POLICY "Tenant admins can view their subscription" 
ON public.tenant_subscriptions_new FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'tenant_admin' AND tenant_id = tenant_subscriptions_new.tenant_id));

CREATE POLICY "System admins can manage all subscriptions" 
ON public.tenant_subscriptions_new FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

-- RLS Policies for invoices
CREATE POLICY "Tenant admins can view their invoices" 
ON public.subscription_invoices FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'tenant_admin' AND tenant_id = subscription_invoices.tenant_id));

CREATE POLICY "System admins can manage all invoices" 
ON public.subscription_invoices FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

-- Similar policies for other tables
CREATE POLICY "System admins can manage all subscription addon mappings" 
ON public.subscription_addon_mappings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage all usage records" 
ON public.subscription_usage_records FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage all invoice items" 
ON public.subscription_invoice_items FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "Tenant admins can manage their payment methods" 
ON public.tenant_payment_methods FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'tenant_admin' AND tenant_id = tenant_payment_methods.tenant_id));

CREATE POLICY "System admins can manage all payment methods" 
ON public.tenant_payment_methods FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage all payments" 
ON public.subscription_payments FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

CREATE POLICY "System admins can manage all coupon redemptions" 
ON public.subscription_coupon_redemptions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'system_admin'));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_subscription_addons_updated_at
    BEFORE UPDATE ON public.subscription_addons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_subscription_coupons_updated_at
    BEFORE UPDATE ON public.subscription_coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_new_updated_at
    BEFORE UPDATE ON public.tenant_subscriptions_new
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_subscription_invoices_updated_at
    BEFORE UPDATE ON public.subscription_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_tenant_payment_methods_updated_at
    BEFORE UPDATE ON public.tenant_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at_column();

CREATE TRIGGER update_subscription_payments_updated_at
    BEFORE UPDATE ON public.subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_updated_at_column();