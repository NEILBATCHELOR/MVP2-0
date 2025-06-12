-- DFNS Fiat Integration Database Schema
-- Creates tables for fiat on/off-ramp transactions and provider configurations

-- ===== Fiat Transactions Table =====
CREATE TABLE IF NOT EXISTS dfns_fiat_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('ramp_network', 'mt_pelerin')),
  provider_transaction_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('onramp', 'offramp')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'waiting_for_payment', 'payment_received', 'completed', 'failed', 'cancelled', 'expired')),
  amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  crypto_asset TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_id UUID REFERENCES dfns_wallets(id),
  payment_method TEXT,
  bank_account JSONB,
  payment_url TEXT,
  withdrawal_address TEXT,
  tx_hash TEXT,
  exchange_rate JSONB,
  fees JSONB,
  estimated_completion_time TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  
  -- Relationships
  user_id UUID,
  project_id UUID,
  organization_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  UNIQUE(provider, provider_transaction_id)
);

-- ===== Fiat Quotes Table =====
CREATE TABLE IF NOT EXISTS dfns_fiat_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('ramp_network', 'mt_pelerin')),
  type TEXT NOT NULL CHECK (type IN ('onramp', 'offramp')),
  from_amount DECIMAL(20, 8) NOT NULL,
  from_currency TEXT NOT NULL,
  to_amount DECIMAL(20, 8) NOT NULL,
  to_currency TEXT NOT NULL,
  exchange_rate DECIMAL(20, 8) NOT NULL,
  fees JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  estimated_processing_time TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Fiat Provider Configurations Table =====
CREATE TABLE IF NOT EXISTS dfns_fiat_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('ramp_network', 'mt_pelerin')),
  configuration JSONB NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  supported_currencies TEXT[] DEFAULT '{}',
  supported_payment_methods TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Fiat Transaction Activity Logs =====
CREATE TABLE IF NOT EXISTS dfns_fiat_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES dfns_fiat_transactions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  provider_data JSONB,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Indexes for Performance =====

-- Fiat Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_provider ON dfns_fiat_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_type ON dfns_fiat_transactions(type);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_status ON dfns_fiat_transactions(status);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_wallet_id ON dfns_fiat_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_user_id ON dfns_fiat_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_project_id ON dfns_fiat_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_organization_id ON dfns_fiat_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_created_at ON dfns_fiat_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_currency ON dfns_fiat_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_crypto_asset ON dfns_fiat_transactions(crypto_asset);

-- Fiat Quotes Indexes
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_quotes_provider ON dfns_fiat_quotes(provider);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_quotes_type ON dfns_fiat_quotes(type);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_quotes_expires_at ON dfns_fiat_quotes(expires_at);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_quotes_created_at ON dfns_fiat_quotes(created_at);

-- Fiat Activity Logs Indexes
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_activity_logs_transaction_id ON dfns_fiat_activity_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_activity_logs_activity_type ON dfns_fiat_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_activity_logs_created_at ON dfns_fiat_activity_logs(created_at);

-- ===== Composite Indexes for Common Queries =====
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_user_status ON dfns_fiat_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_wallet_type ON dfns_fiat_transactions(wallet_id, type);
CREATE INDEX IF NOT EXISTS idx_dfns_fiat_transactions_provider_status ON dfns_fiat_transactions(provider, status);

-- ===== Triggers for Updated At =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dfns_fiat_transactions_updated_at
    BEFORE UPDATE ON dfns_fiat_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dfns_fiat_provider_configs_updated_at
    BEFORE UPDATE ON dfns_fiat_provider_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== Row Level Security (RLS) =====

-- Enable RLS on all tables
ALTER TABLE dfns_fiat_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_fiat_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_fiat_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_fiat_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for fiat transactions
CREATE POLICY "Users can view their own fiat transactions" ON dfns_fiat_transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own fiat transactions" ON dfns_fiat_transactions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own fiat transactions" ON dfns_fiat_transactions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policies for fiat quotes (can be viewed by anyone, short-lived)
CREATE POLICY "Anyone can view fiat quotes" ON dfns_fiat_quotes
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage fiat quotes" ON dfns_fiat_quotes
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for provider configurations (admin only)
CREATE POLICY "Service role can manage provider configs" ON dfns_fiat_provider_configs
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for activity logs
CREATE POLICY "Users can view their transaction activity logs" ON dfns_fiat_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dfns_fiat_transactions 
            WHERE id = dfns_fiat_activity_logs.transaction_id 
            AND user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Service role can manage activity logs" ON dfns_fiat_activity_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ===== Default Provider Configurations =====

-- Insert default Ramp Network configuration
INSERT INTO dfns_fiat_provider_configs (
    provider,
    configuration,
    is_enabled,
    supported_currencies,
    supported_payment_methods
) VALUES (
    'ramp_network',
    '{
        "apiKey": "",
        "hostAppName": "Chain Capital Production",
        "hostLogoUrl": "/logo.png",
        "enabledFlows": ["ONRAMP", "OFFRAMP"],
        "environment": "production"
    }',
    true,
    '{"USD", "EUR", "GBP", "CAD", "AUD"}',
    '{"card", "bank_transfer", "sepa", "apple_pay", "google_pay"}'
) ON CONFLICT (provider) DO NOTHING;

-- Insert default Mt Pelerin configuration
INSERT INTO dfns_fiat_provider_configs (
    provider,
    configuration,
    is_enabled,
    supported_currencies,
    supported_payment_methods
) VALUES (
    'mt_pelerin',
    '{
        "apiKey": "",
        "environment": "production"
    }',
    true,
    '{"USD", "EUR", "CHF"}',
    '{"card", "bank_transfer"}'
) ON CONFLICT (provider) DO NOTHING;

-- ===== Comments =====
COMMENT ON TABLE dfns_fiat_transactions IS 'Stores fiat on/off-ramp transactions through DFNS providers';
COMMENT ON TABLE dfns_fiat_quotes IS 'Stores temporary fiat conversion quotes with expiration';
COMMENT ON TABLE dfns_fiat_provider_configs IS 'Configuration for fiat service providers';
COMMENT ON TABLE dfns_fiat_activity_logs IS 'Activity logs for fiat transaction tracking';

COMMENT ON COLUMN dfns_fiat_transactions.provider IS 'Fiat service provider (ramp_network, mt_pelerin)';
COMMENT ON COLUMN dfns_fiat_transactions.type IS 'Transaction type (onramp = fiat→crypto, offramp = crypto→fiat)';
COMMENT ON COLUMN dfns_fiat_transactions.status IS 'Current transaction status';
COMMENT ON COLUMN dfns_fiat_transactions.exchange_rate IS 'Exchange rate information including rate, timestamp, and provider';
COMMENT ON COLUMN dfns_fiat_transactions.fees IS 'Fee breakdown including provider fees, network fees, and total';
COMMENT ON COLUMN dfns_fiat_transactions.bank_account IS 'Bank account information for off-ramp transactions';
COMMENT ON COLUMN dfns_fiat_transactions.payment_url IS 'Provider payment URL for completing on-ramp transactions';
COMMENT ON COLUMN dfns_fiat_transactions.withdrawal_address IS 'Provider address for sending crypto in off-ramp transactions';
