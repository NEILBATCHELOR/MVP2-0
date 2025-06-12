-- Main MoonPay Transactions Table
-- This table is required by the OnRampService and OffRampService

CREATE TABLE IF NOT EXISTS moonpay_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_transaction_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'waitingPayment', 'waitingAuthorization', 'waitingCapture', 'processing', 'cancelled', 'expired')),
    crypto_currency TEXT NOT NULL,
    fiat_currency TEXT NOT NULL,
    crypto_amount NUMERIC,
    fiat_amount NUMERIC NOT NULL,
    wallet_address TEXT,
    redirect_url TEXT,
    widget_redirect_url TEXT,
    customer_id TEXT,
    payment_method TEXT,
    fees JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moonpay_transactions_external_id ON moonpay_transactions(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_transactions_type ON moonpay_transactions(type);
CREATE INDEX IF NOT EXISTS idx_moonpay_transactions_status ON moonpay_transactions(status);
CREATE INDEX IF NOT EXISTS idx_moonpay_transactions_created_at ON moonpay_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_moonpay_transactions_customer_id ON moonpay_transactions(customer_id);

-- Enable RLS
ALTER TABLE moonpay_transactions ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_moonpay_transactions_updated_at 
    BEFORE UPDATE ON moonpay_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
