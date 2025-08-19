-- Enable UUID support if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------
-- 1. FINANCE MODULE TABLES
-----------------------------------------------------

-- Enhanced accounts table (if not exists or needs updates)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_accounts') THEN
        CREATE TABLE finance_accounts (
            account_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            account_code    VARCHAR(50) NOT NULL UNIQUE,
            account_name    VARCHAR(255) NOT NULL,
            type            VARCHAR(20) CHECK (type IN ('Asset','Liability','Income','Expense','Equity')),
            parent_account  UUID REFERENCES finance_accounts(account_id),
            tenant_id       UUID NOT NULL,
            is_active       BOOLEAN DEFAULT TRUE,
            created_at      TIMESTAMP DEFAULT NOW(),
            updated_at      TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- Enhanced journals table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_journals') THEN
        CREATE TABLE finance_journals (
            journal_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            journal_type    VARCHAR(20) CHECK (journal_type IN ('Accrual','Payment','Adjustment')),
            reference_id    UUID,
            description     TEXT,
            status          VARCHAR(20) CHECK (status IN ('Draft','Posted','Cancelled')) DEFAULT 'Draft',
            trace_id        UUID,
            tenant_id       UUID NOT NULL,
            created_by      UUID NOT NULL,
            created_at      TIMESTAMP DEFAULT NOW(),
            posted_at       TIMESTAMP
        );
    END IF;
END $$;

-- Enhanced journal lines table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_journal_lines') THEN
        CREATE TABLE finance_journal_lines (
            line_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            journal_id      UUID NOT NULL REFERENCES finance_journals(journal_id) ON DELETE CASCADE,
            account_id      UUID NOT NULL REFERENCES finance_accounts(account_id),
            debit           NUMERIC(18,2) DEFAULT 0 CHECK (debit >= 0),
            credit          NUMERIC(18,2) DEFAULT 0 CHECK (credit >= 0),
            currency        VARCHAR(3) DEFAULT 'INR',
            fx_rate         NUMERIC(18,6) DEFAULT 1.0,
            created_at      TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- Finance settlements table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_settlements') THEN
        CREATE TABLE finance_settlements (
            settlement_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            insurer_id      UUID,
            period          DATE NOT NULL,
            expected_amount NUMERIC(18,2) NOT NULL,
            received_amount NUMERIC(18,2),
            variance_amount NUMERIC(18,2),
            status          VARCHAR(20) CHECK (status IN ('Pending','Reconciled','Approved','Posted')) DEFAULT 'Pending',
            approved_by     UUID,
            trace_id        UUID,
            tenant_id       UUID NOT NULL,
            created_at      TIMESTAMP DEFAULT NOW(),
            updated_at      TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- Finance payouts table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_payouts') THEN
        CREATE TABLE finance_payouts (
            payout_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            org_id          UUID NOT NULL,
            agent_name      VARCHAR(255),
            amount          NUMERIC(18,2) NOT NULL,
            request_date    DATE NOT NULL,
            status          VARCHAR(20) CHECK (status IN ('Requested','Approved','Paid','Cancelled')) DEFAULT 'Requested',
            payment_ref     VARCHAR(100),
            trace_id        UUID,
            approved_by     UUID,
            tenant_id       UUID NOT NULL,
            breakdown       JSONB,
            created_at      TIMESTAMP DEFAULT NOW(),
            updated_at      TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- Finance variances table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_variances') THEN
        CREATE TABLE finance_variances (
            variance_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            type            VARCHAR(20) CHECK (type IN ('Insurer','Revenue','Payout')),
            reference_id    UUID NOT NULL,
            expected_value  NUMERIC(18,2),
            actual_value    NUMERIC(18,2),
            difference      NUMERIC(18,2),
            status          VARCHAR(20) CHECK (status IN ('Open','Under Review','Resolved')) DEFAULT 'Open',
            assigned_to     UUID,
            description     TEXT,
            trace_id        UUID,
            tenant_id       UUID NOT NULL,
            created_at      TIMESTAMP DEFAULT NOW(),
            updated_at      TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-----------------------------------------------------
-- 2. INDEXES FOR PERFORMANCE
-----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_finance_journals_trace ON finance_journals(trace_id);
CREATE INDEX IF NOT EXISTS idx_finance_journals_tenant ON finance_journals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_settlements_trace ON finance_settlements(trace_id);
CREATE INDEX IF NOT EXISTS idx_finance_settlements_tenant ON finance_settlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_payouts_trace ON finance_payouts(trace_id);
CREATE INDEX IF NOT EXISTS idx_finance_payouts_tenant ON finance_payouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_variances_trace ON finance_variances(trace_id);
CREATE INDEX IF NOT EXISTS idx_finance_variances_tenant ON finance_variances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_tenant ON finance_accounts(tenant_id);

-----------------------------------------------------
-- 3. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_finance_settlements_updated_at ON finance_settlements;
CREATE TRIGGER update_finance_settlements_updated_at
    BEFORE UPDATE ON finance_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_payouts_updated_at ON finance_payouts;
CREATE TRIGGER update_finance_payouts_updated_at
    BEFORE UPDATE ON finance_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_variances_updated_at ON finance_variances;
CREATE TRIGGER update_finance_variances_updated_at
    BEFORE UPDATE ON finance_variances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_accounts_updated_at ON finance_accounts;
CREATE TRIGGER update_finance_accounts_updated_at
    BEFORE UPDATE ON finance_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();