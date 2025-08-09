-- Create QuoteSession table for tracking purchase progress
CREATE TABLE public.quote_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  line_of_business TEXT NOT NULL,
  product_id UUID,
  selected_insurer_id UUID,
  insured_persons JSONB DEFAULT '[]'::jsonb,
  vehicle_details JSONB,
  quote_responses JSONB DEFAULT '[]'::jsonb,
  selected_quote JSONB,
  addons_selected JSONB DEFAULT '[]'::jsonb,
  sum_insured NUMERIC,
  premium_amount NUMERIC,
  proposal_data JSONB,
  current_step TEXT CHECK (current_step IN (
    'product-selection',
    'customer-details', 
    'quote-result',
    'addon-selection',
    'proposal-form',
    'payment',
    'complete'
  )) DEFAULT 'product-selection',
  is_complete BOOLEAN DEFAULT false,
  policy_id UUID,
  payment_status TEXT CHECK (payment_status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  payment_gateway TEXT CHECK (payment_gateway IN ('razorpay', 'paytm')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

-- Create PaymentRecord table
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_session_id UUID REFERENCES public.quote_sessions(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.policies_new(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  gateway TEXT CHECK (gateway IN ('razorpay', 'paytm')) NOT NULL,
  transaction_id TEXT,
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Policies for quote_sessions
CREATE POLICY "Users can manage their quote sessions" ON public.quote_sessions
  FOR ALL USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND phone_number IS NOT NULL)
  );

CREATE POLICY "Admin can manage all quote sessions" ON public.quote_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Policies for payment_records  
CREATE POLICY "Users can view their payment records" ON public.payment_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all payment records" ON public.payment_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Triggers for updated_at
CREATE TRIGGER update_quote_sessions_updated_at
  BEFORE UPDATE ON public.quote_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records  
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_quote_sessions_user_phone ON public.quote_sessions(user_id, phone_number);
CREATE INDEX idx_quote_sessions_expires_at ON public.quote_sessions(expires_at);
CREATE INDEX idx_payment_records_session ON public.payment_records(quote_session_id);