-- Enhanced Moonpay Integration Database Schema
-- Additional tables to support complete Moonpay API integration

-- ===== SWAP TRANSACTIONS TABLE =====
CREATE TABLE IF NOT EXISTS moonpay_swap_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_transaction_id TEXT UNIQUE,
    quote_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    base_amount NUMERIC NOT NULL,
    quote_amount NUMERIC NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    tx_hash TEXT,
    fees JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== NFT PASSES TABLE =====
CREATE TABLE IF NOT EXISTS moonpay_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_pass_id TEXT UNIQUE,
    project_id TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    metadata_url TEXT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    attributes JSONB,
    owner_address TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'minted', 'transferred', 'burned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== NFT PROJECTS TABLE =====
CREATE TABLE IF NOT EXISTS moonpay_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_project_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    contract_address TEXT,
    network TEXT NOT NULL,
    total_supply INTEGER,
    max_supply INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== CUSTOMER PROFILES TABLE =====
CREATE TABLE IF NOT EXISTS moonpay_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_customer_id TEXT UNIQUE,
    moonpay_customer_id TEXT UNIQUE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    address JSONB,
    kyc_level TEXT CHECK (kyc_level IN ('none', 'basic', 'enhanced', 'premium')) DEFAULT 'none',
    identity_verification_status TEXT CHECK (identity_verification_status IN ('pending', 'completed', 'failed')),
    verification_documents JSONB,
    transaction_limits JSONB,
    preferred_payment_methods TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== POLICIES TABLE =====
CREATE TABLE IF NOT EXISTS moonpay_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_policy_id TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('kyc', 'transaction', 'compliance', 'risk')),
    rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== WEBHOOK EVENTS TABLE =====
CREATE TABLE IF NOT EXISTS moonpay_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    signature TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_attempts INTEGER DEFAULT 0,
    last_processing_error TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ===== ASSET CACHE TABLE =====
CREATE TABLE IF NOT EXISTS moonpay_asset_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    asset_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    UNIQUE(contract_address, token_id)
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Swap transactions indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_swap_transactions_external_id ON moonpay_swap_transactions(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_swap_transactions_status ON moonpay_swap_transactions(status);
CREATE INDEX IF NOT EXISTS idx_moonpay_swap_transactions_created_at ON moonpay_swap_transactions(created_at);

-- Passes indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_passes_project_id ON moonpay_passes(project_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_passes_contract_token ON moonpay_passes(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_passes_owner ON moonpay_passes(owner_address);
CREATE INDEX IF NOT EXISTS idx_moonpay_passes_status ON moonpay_passes(status);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_customers_external_id ON moonpay_customers(external_customer_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_customers_moonpay_id ON moonpay_customers(moonpay_customer_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_customers_email ON moonpay_customers(email);

-- Webhook events indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_events_type ON moonpay_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_events_processed ON moonpay_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_events_received_at ON moonpay_webhook_events(received_at);

-- Asset cache indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_asset_cache_contract_token ON moonpay_asset_cache(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_asset_cache_expires_at ON moonpay_asset_cache(expires_at);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Enable RLS on all tables
ALTER TABLE moonpay_swap_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_asset_cache ENABLE ROW LEVEL SECURITY;

-- ===== TRIGGERS FOR UPDATED_AT =====

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_moonpay_swap_transactions_updated_at 
    BEFORE UPDATE ON moonpay_swap_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moonpay_passes_updated_at 
    BEFORE UPDATE ON moonpay_passes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moonpay_projects_updated_at 
    BEFORE UPDATE ON moonpay_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moonpay_customers_updated_at 
    BEFORE UPDATE ON moonpay_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moonpay_policies_updated_at 
    BEFORE UPDATE ON moonpay_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== CLEANUP FUNCTIONS =====

-- Function to clean up expired asset cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_asset_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM moonpay_asset_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old webhook events (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM moonpay_webhook_events 
    WHERE processed = true 
    AND received_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
