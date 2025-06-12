-- RAMP Network Integration Database Schema
-- Migration for enhanced DFNS fiat integration with RAMP Network
-- Created: June 11, 2025

-- Create RAMP webhook events table for audit logging
CREATE TABLE IF NOT EXISTS ramp_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE, -- RAMP Network event ID
    event_type TEXT NOT NULL, -- CREATED, RELEASED, EXPIRED, CANCELLED
    flow_type TEXT NOT NULL CHECK (flow_type IN ('onramp', 'offramp')),
    payload JSONB NOT NULL, -- Full webhook payload
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_ramp_webhook_events_event_id ON ramp_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_ramp_webhook_events_type ON ramp_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ramp_webhook_events_flow_type ON ramp_webhook_events(flow_type);
CREATE INDEX IF NOT EXISTS idx_ramp_webhook_events_created_at ON ramp_webhook_events(created_at DESC);

-- Enhance existing fiat_transactions table if it exists, otherwise create it
CREATE TABLE IF NOT EXISTS fiat_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('ramp_network', 'mt_pelerin')),
    provider_transaction_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('onramp', 'offramp')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'waiting_for_payment', 'payment_received', 'completed', 'failed', 'cancelled', 'expired')),
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    crypto_asset TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    wallet_id UUID,
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
    user_id UUID,
    project_id UUID,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for fiat_transactions if they don't exist
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_provider ON fiat_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_provider_transaction_id ON fiat_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_type ON fiat_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_status ON fiat_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_wallet_address ON fiat_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_user_id ON fiat_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_created_at ON fiat_transactions(created_at DESC);

-- Create unique constraint on provider + provider_transaction_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fiat_transactions_provider_transaction_unique'
    ) THEN
        ALTER TABLE fiat_transactions 
        ADD CONSTRAINT fiat_transactions_provider_transaction_unique 
        UNIQUE (provider, provider_transaction_id);
    END IF;
END $$;

-- Create fiat quotes table for quote tracking
CREATE TABLE IF NOT EXISTS fiat_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    user_id UUID,
    session_id TEXT,
    converted_to_transaction_id UUID REFERENCES fiat_transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for fiat_quotes
CREATE INDEX IF NOT EXISTS idx_fiat_quotes_provider ON fiat_quotes(provider);
CREATE INDEX IF NOT EXISTS idx_fiat_quotes_type ON fiat_quotes(type);
CREATE INDEX IF NOT EXISTS idx_fiat_quotes_expires_at ON fiat_quotes(expires_at);
CREATE INDEX IF NOT EXISTS idx_fiat_quotes_user_id ON fiat_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_fiat_quotes_session_id ON fiat_quotes(session_id);
CREATE INDEX IF NOT EXISTS idx_fiat_quotes_created_at ON fiat_quotes(created_at DESC);

-- Create RAMP Network supported assets cache table
CREATE TABLE IF NOT EXISTS ramp_supported_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    chain TEXT NOT NULL,
    type TEXT NOT NULL, -- NATIVE, ERC20, etc.
    address TEXT, -- Contract address for tokens
    logo_url TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    hidden BOOLEAN NOT NULL DEFAULT false,
    decimals INTEGER NOT NULL,
    price_data JSONB, -- Price per currency
    currency_code TEXT NOT NULL DEFAULT 'USD',
    min_purchase_amount DECIMAL(20, 8),
    max_purchase_amount DECIMAL(20, 8),
    min_purchase_crypto_amount TEXT, -- In wei/smallest unit
    network_fee DECIMAL(20, 8),
    flow_type TEXT NOT NULL CHECK (flow_type IN ('onramp', 'offramp', 'both')),
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for ramp_supported_assets
CREATE INDEX IF NOT EXISTS idx_ramp_supported_assets_symbol ON ramp_supported_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_ramp_supported_assets_chain ON ramp_supported_assets(chain);
CREATE INDEX IF NOT EXISTS idx_ramp_supported_assets_enabled ON ramp_supported_assets(enabled);
CREATE INDEX IF NOT EXISTS idx_ramp_supported_assets_flow_type ON ramp_supported_assets(flow_type);
CREATE INDEX IF NOT EXISTS idx_ramp_supported_assets_last_updated ON ramp_supported_assets(last_updated DESC);

-- Create unique constraint on symbol + chain + flow_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ramp_supported_assets_symbol_chain_flow_unique'
    ) THEN
        ALTER TABLE ramp_supported_assets 
        ADD CONSTRAINT ramp_supported_assets_symbol_chain_flow_unique 
        UNIQUE (symbol, chain, flow_type);
    END IF;
END $$;

-- Create RAMP Network configuration table
CREATE TABLE IF NOT EXISTS ramp_network_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    api_key_encrypted TEXT NOT NULL, -- Encrypted API key
    host_app_name TEXT NOT NULL,
    host_logo_url TEXT NOT NULL,
    enabled_flows TEXT[] NOT NULL DEFAULT ARRAY['ONRAMP', 'OFFRAMP'],
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('staging', 'production')),
    webhook_secret_encrypted TEXT, -- Encrypted webhook secret
    configuration JSONB DEFAULT '{}', -- Additional configuration
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for ramp_network_config
CREATE INDEX IF NOT EXISTS idx_ramp_network_config_organization_id ON ramp_network_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_ramp_network_config_environment ON ramp_network_config(environment);
CREATE INDEX IF NOT EXISTS idx_ramp_network_config_is_active ON ramp_network_config(is_active);

-- Create RAMP transaction events table for detailed event tracking
CREATE TABLE IF NOT EXISTS ramp_transaction_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES fiat_transactions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- widget_open, quote_requested, purchase_created, etc.
    event_data JSONB NOT NULL,
    ramp_event_id TEXT, -- RAMP Network's event ID if applicable
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    session_id TEXT,
    user_agent TEXT,
    ip_address INET
);

-- Create indexes for ramp_transaction_events
CREATE INDEX IF NOT EXISTS idx_ramp_transaction_events_transaction_id ON ramp_transaction_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ramp_transaction_events_event_type ON ramp_transaction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ramp_transaction_events_timestamp ON ramp_transaction_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ramp_transaction_events_session_id ON ramp_transaction_events(session_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_ramp_webhook_events_updated_at ON ramp_webhook_events;
CREATE TRIGGER update_ramp_webhook_events_updated_at
    BEFORE UPDATE ON ramp_webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fiat_transactions_updated_at ON fiat_transactions;
CREATE TRIGGER update_fiat_transactions_updated_at
    BEFORE UPDATE ON fiat_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ramp_network_config_updated_at ON ramp_network_config;
CREATE TRIGGER update_ramp_network_config_updated_at
    BEFORE UPDATE ON ramp_network_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial RAMP Network configuration (optional)
INSERT INTO ramp_network_config (
    api_key_encrypted,
    host_app_name,
    host_logo_url,
    enabled_flows,
    environment,
    configuration
) VALUES (
    'ENCRYPTED_API_KEY_PLACEHOLDER', -- Replace with actual encrypted API key
    'Chain Capital Production',
    '/logo.png',
    ARRAY['ONRAMP', 'OFFRAMP'],
    'production',
    '{
        "enableNativeFlow": true,
        "enableQuotes": true,
        "enableWebhooks": true,
        "enableEventTracking": true,
        "preferredPaymentMethods": ["CARD_PAYMENT", "APPLE_PAY", "GOOGLE_PAY"],
        "primaryColor": "#1f2937",
        "borderRadius": "8px"
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- Add comments to tables
COMMENT ON TABLE ramp_webhook_events IS 'Stores RAMP Network webhook events for audit and processing tracking';
COMMENT ON TABLE fiat_transactions IS 'Stores fiat on/off-ramp transactions from all providers including RAMP Network';
COMMENT ON TABLE fiat_quotes IS 'Stores fiat transaction quotes with expiration tracking';
COMMENT ON TABLE ramp_supported_assets IS 'Cache of RAMP Network supported assets with pricing and limits';
COMMENT ON TABLE ramp_network_config IS 'RAMP Network API configuration per organization';
COMMENT ON TABLE ramp_transaction_events IS 'Detailed event tracking for RAMP Network transactions';

-- Grant permissions (adjust as needed for your security model)
-- GRANT SELECT, INSERT, UPDATE ON ramp_webhook_events TO your_api_user;
-- GRANT SELECT, INSERT, UPDATE ON fiat_transactions TO your_api_user;
-- GRANT SELECT, INSERT, UPDATE ON fiat_quotes TO your_api_user;
-- GRANT SELECT, INSERT, UPDATE ON ramp_supported_assets TO your_api_user;
-- GRANT SELECT ON ramp_network_config TO your_api_user;
-- GRANT SELECT, INSERT ON ramp_transaction_events TO your_api_user;

-- Migration complete
COMMENT ON SCHEMA public IS 'Enhanced DFNS RAMP Network Integration - Schema updated on June 11, 2025';
