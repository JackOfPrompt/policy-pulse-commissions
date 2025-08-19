-- Create missing fact tables for advanced analytics

-- Fact table for renewal events
CREATE TABLE IF NOT EXISTS fact_renewal_events (
  renewal_id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  policy_id BIGINT NOT NULL,
  due_date DATE NOT NULL,
  renewed BOOLEAN NOT NULL DEFAULT false,
  renewal_date DATE,
  original_premium NUMERIC,
  renewed_premium NUMERIC,
  reason_code VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fact table for claims
CREATE TABLE IF NOT EXISTS fact_claims (
  claim_id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  policy_id BIGINT NOT NULL,
  claim_number VARCHAR(100) NOT NULL,
  intimation_date DATE NOT NULL,
  decision_date DATE,
  settlement_amount NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Open',
  claim_type VARCHAR(50),
  cause_of_loss VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fact table for invoices/receivables
CREATE TABLE IF NOT EXISTS fact_invoices (
  invoice_id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  policy_id BIGINT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Open',
  invoice_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE fact_renewal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read renewal events" 
ON fact_renewal_events FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage renewal events" 
ON fact_renewal_events FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'
));

CREATE POLICY "Allow authenticated users to read claims" 
ON fact_claims FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage claims" 
ON fact_claims FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'
));

CREATE POLICY "Allow authenticated users to read invoices" 
ON fact_invoices FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage invoices" 
ON fact_invoices FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'system_admin'
));

-- Insert sample data for testing
INSERT INTO fact_renewal_events (tenant_id, policy_id, due_date, renewed, renewal_date, original_premium, renewed_premium) VALUES
(1, 100001, '2025-01-15', true, '2025-01-14', 25000, 26000),
(1, 100002, '2025-02-16', false, null, 35000, null),
(1, 100003, '2025-03-17', true, '2025-03-16', 28000, 29000),
(1, 100004, '2025-04-18', true, '2025-04-17', 45000, 47000),
(1, 100005, '2025-05-19', false, null, 32000, null);

INSERT INTO fact_claims (tenant_id, policy_id, claim_number, intimation_date, decision_date, settlement_amount, status) VALUES
(1, 100001, 'CLM001', '2025-02-01', '2025-02-15', 15000, 'Settled'),
(1, 100003, 'CLM002', '2025-03-01', null, 0, 'Open'),
(1, 100004, 'CLM003', '2025-04-01', '2025-04-20', 25000, 'Settled'),
(1, 100002, 'CLM004', '2025-05-01', null, 0, 'Under Investigation');

INSERT INTO fact_invoices (tenant_id, policy_id, invoice_number, due_date, amount_due, amount_paid, status) VALUES
(1, 100001, 'INV001', '2025-02-15', 29500, 29500, 'Paid'),
(1, 100002, 'INV002', '2025-03-16', 41300, 20000, 'Unpaid'),
(1, 100003, 'INV003', '2025-04-17', 33040, 33040, 'Paid'),
(1, 100004, 'INV004', '2025-05-18', 53100, 0, 'Open'),
(1, 100005, 'INV005', '2025-06-19', 37760, 10000, 'Unpaid');

-- Enable realtime for new tables
ALTER TABLE fact_renewal_events REPLICA IDENTITY FULL;
ALTER TABLE fact_claims REPLICA IDENTITY FULL;
ALTER TABLE fact_invoices REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE fact_renewal_events;
ALTER PUBLICATION supabase_realtime ADD TABLE fact_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE fact_invoices;