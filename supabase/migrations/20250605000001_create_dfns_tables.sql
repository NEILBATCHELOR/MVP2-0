-- =====================================================
-- DFNS Integration Database Migration
-- Creates all tables for DFNS (Digital Finance) platform integration
-- Date: June 5, 2025
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DFNS Applications & Authentication Tables
-- =====================================================

-- DFNS Applications table
CREATE TABLE IF NOT EXISTS dfns_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('ClientSide', 'ServerSide')),
    origin TEXT,
    relying_party TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
    external_id TEXT,
    logo_url TEXT,
    terms_of_service_url TEXT,
    privacy_policy_url TEXT,
    organization_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Users table
CREATE TABLE IF NOT EXISTS dfns_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending', 'Suspended')),
    kind TEXT NOT NULL CHECK (kind IN ('EndUser', 'Employee', 'PatientUser')),
    external_id TEXT,
    public_key TEXT,
    recovery_setup BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    organization_id TEXT,
    dfns_user_id TEXT UNIQUE, -- DFNS internal user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Credentials table
CREATE TABLE IF NOT EXISTS dfns_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credential_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES dfns_users(id) ON DELETE CASCADE,
    name TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('Fido2', 'Key', 'Password', 'RecoveryKey')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    public_key TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    attestation_type TEXT,
    authenticator_info JSONB,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    dfns_credential_id TEXT UNIQUE, -- DFNS internal credential ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Service Accounts table
CREATE TABLE IF NOT EXISTS dfns_service_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    external_id TEXT,
    public_key TEXT,
    permission_assignments JSONB,
    organization_id TEXT,
    dfns_service_account_id TEXT UNIQUE, -- DFNS internal service account ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Personal Access Tokens table
CREATE TABLE IF NOT EXISTS dfns_personal_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    permission_assignments JSONB,
    user_id UUID REFERENCES dfns_users(id) ON DELETE CASCADE,
    dfns_token_id TEXT UNIQUE, -- DFNS internal token ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DFNS Wallets & Keys Tables
-- =====================================================

-- DFNS Signing Keys table
CREATE TABLE IF NOT EXISTS dfns_signing_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    network TEXT NOT NULL,
    curve TEXT NOT NULL CHECK (curve IN ('ed25519', 'secp256k1', 'secp256r1')),
    scheme TEXT NOT NULL CHECK (scheme IN ('EdDSA', 'ECDSA')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    delegated BOOLEAN DEFAULT FALSE,
    delegated_to TEXT,
    external_id TEXT,
    tags TEXT[],
    imported BOOLEAN DEFAULT FALSE,
    exported BOOLEAN DEFAULT FALSE,
    date_exported TIMESTAMP WITH TIME ZONE,
    organization_id TEXT,
    dfns_key_id TEXT UNIQUE NOT NULL, -- DFNS internal key ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Wallets table
CREATE TABLE IF NOT EXISTS dfns_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id TEXT UNIQUE NOT NULL,
    network TEXT NOT NULL,
    name TEXT,
    address TEXT NOT NULL,
    signing_key_id TEXT REFERENCES dfns_signing_keys(key_id) ON DELETE RESTRICT,
    custodial BOOLEAN DEFAULT TRUE,
    imported BOOLEAN DEFAULT FALSE,
    exported BOOLEAN DEFAULT FALSE,
    date_exported TIMESTAMP WITH TIME ZONE,
    external_id TEXT,
    tags TEXT[],
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    delegated BOOLEAN DEFAULT FALSE,
    delegated_to TEXT,
    organization_id TEXT,
    project_id UUID, -- Link to existing projects table if exists
    investor_id UUID, -- Link to existing investors table if exists
    dfns_wallet_id TEXT UNIQUE NOT NULL, -- DFNS internal wallet ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Wallet Balances table (for caching)
CREATE TABLE IF NOT EXISTS dfns_wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id TEXT REFERENCES dfns_wallets(wallet_id) ON DELETE CASCADE,
    asset_symbol TEXT NOT NULL,
    asset_name TEXT,
    contract_address TEXT,
    balance TEXT NOT NULL DEFAULT '0',
    value_in_usd TEXT,
    decimals INTEGER NOT NULL DEFAULT 18,
    verified BOOLEAN DEFAULT FALSE,
    native_asset BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, asset_symbol, contract_address)
);

-- DFNS Wallet NFTs table (for caching)
CREATE TABLE IF NOT EXISTS dfns_wallet_nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id TEXT REFERENCES dfns_wallets(wallet_id) ON DELETE CASCADE,
    contract TEXT NOT NULL,
    token_id TEXT NOT NULL,
    collection TEXT,
    name TEXT,
    description TEXT,
    image_url TEXT,
    external_url TEXT,
    attributes JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, contract, token_id)
);

-- DFNS Transaction History table (for caching)
CREATE TABLE IF NOT EXISTS dfns_transaction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id TEXT REFERENCES dfns_wallets(wallet_id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('Incoming', 'Outgoing')),
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Failed', 'Cancelled')),
    asset_symbol TEXT NOT NULL,
    asset_name TEXT,
    contract_address TEXT,
    amount TEXT NOT NULL,
    fee TEXT,
    to_address TEXT,
    from_address TEXT,
    block_number BIGINT,
    block_hash TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, tx_hash)
);

-- =====================================================
-- DFNS Transfer & Transaction Tables
-- =====================================================

-- DFNS Transfers table
CREATE TABLE IF NOT EXISTS dfns_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id TEXT UNIQUE NOT NULL,
    wallet_id TEXT REFERENCES dfns_wallets(wallet_id) ON DELETE CASCADE,
    to_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    asset TEXT,
    memo TEXT,
    external_id TEXT,
    nonce INTEGER,
    gas_limit TEXT,
    gas_price TEXT,
    max_fee_per_gas TEXT,
    max_priority_fee_per_gas TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Broadcasted', 'Confirmed', 'Failed', 'Cancelled')),
    tx_hash TEXT,
    fee TEXT,
    date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    date_broadcast TIMESTAMP WITH TIME ZONE,
    date_confirmed TIMESTAMP WITH TIME ZONE,
    estimated_confirmation_time TEXT,
    error_message TEXT,
    dfns_transfer_id TEXT UNIQUE NOT NULL, -- DFNS internal transfer ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Signatures table
CREATE TABLE IF NOT EXISTS dfns_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signature_id TEXT UNIQUE NOT NULL,
    key_id TEXT REFERENCES dfns_signing_keys(key_id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    message TEXT NOT NULL,
    external_id TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Signed', 'Failed', 'Cancelled')),
    signature TEXT,
    public_key TEXT NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    date_completed TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    dfns_signature_id TEXT UNIQUE NOT NULL, -- DFNS internal signature ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Broadcast Transactions table
CREATE TABLE IF NOT EXISTS dfns_broadcast_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id TEXT UNIQUE NOT NULL,
    wallet_id TEXT REFERENCES dfns_wallets(wallet_id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    transaction TEXT NOT NULL, -- Serialized transaction
    external_id TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Broadcasted', 'Confirmed', 'Failed', 'Cancelled')),
    tx_hash TEXT,
    date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    date_broadcast TIMESTAMP WITH TIME ZONE,
    date_confirmed TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    dfns_broadcast_id TEXT UNIQUE NOT NULL, -- DFNS internal broadcast ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DFNS Permission & Policy Tables
-- =====================================================

-- DFNS Permissions table
CREATE TABLE IF NOT EXISTS dfns_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    resources TEXT[] NOT NULL,
    operations TEXT[] NOT NULL,
    effect TEXT NOT NULL CHECK (effect IN ('Allow', 'Deny')),
    condition JSONB,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    description TEXT,
    category TEXT,
    organization_id TEXT,
    dfns_permission_id TEXT UNIQUE, -- DFNS internal permission ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Permission Assignments table
CREATE TABLE IF NOT EXISTS dfns_permission_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_id TEXT REFERENCES dfns_permissions(permission_id) ON DELETE CASCADE,
    identity_id TEXT NOT NULL,
    identity_kind TEXT NOT NULL CHECK (identity_kind IN ('User', 'ServiceAccount', 'PersonalAccessToken')),
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    organization_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(permission_id, identity_id, identity_kind)
);

-- DFNS Policies table
CREATE TABLE IF NOT EXISTS dfns_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rule JSONB NOT NULL,
    activity_kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    external_id TEXT,
    organization_id TEXT,
    dfns_policy_id TEXT UNIQUE, -- DFNS internal policy ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Policy Approvals table
CREATE TABLE IF NOT EXISTS dfns_policy_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id TEXT UNIQUE NOT NULL,
    activity_id TEXT NOT NULL,
    policy_id TEXT REFERENCES dfns_policies(policy_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Failed')),
    reason TEXT,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by TEXT,
    rejected_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    organization_id TEXT,
    dfns_approval_id TEXT UNIQUE, -- DFNS internal approval ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DFNS Webhook Tables
-- =====================================================

-- DFNS Webhooks table
CREATE TABLE IF NOT EXISTS dfns_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    events TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    secret TEXT,
    headers JSONB,
    external_id TEXT,
    organization_id TEXT,
    dfns_webhook_id TEXT UNIQUE, -- DFNS internal webhook ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Webhook Deliveries table
CREATE TABLE IF NOT EXISTS dfns_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id TEXT UNIQUE NOT NULL,
    webhook_id TEXT REFERENCES dfns_webhooks(webhook_id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Delivered', 'Failed', 'Retrying')),
    response_code INTEGER,
    response_body TEXT,
    attempts INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DFNS Integration Tables
-- =====================================================

-- DFNS Exchange Integrations table
CREATE TABLE IF NOT EXISTS dfns_exchange_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    exchange_kind TEXT NOT NULL CHECK (exchange_kind IN ('Kraken', 'Binance', 'CoinbasePrime')),
    credentials JSONB NOT NULL, -- Encrypted credentials
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Error')),
    config JSONB,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    organization_id TEXT,
    dfns_exchange_id TEXT UNIQUE, -- DFNS internal exchange ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Exchange Accounts table (for caching)
CREATE TABLE IF NOT EXISTS dfns_exchange_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id TEXT UNIQUE NOT NULL,
    exchange_integration_id TEXT REFERENCES dfns_exchange_integrations(integration_id) ON DELETE CASCADE,
    account_type TEXT NOT NULL,
    trading_enabled BOOLEAN DEFAULT FALSE,
    withdrawal_enabled BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dfns_account_id TEXT UNIQUE, -- DFNS internal account ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Exchange Balances table (for caching)
CREATE TABLE IF NOT EXISTS dfns_exchange_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id TEXT REFERENCES dfns_exchange_accounts(account_id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    total TEXT NOT NULL DEFAULT '0',
    available TEXT NOT NULL DEFAULT '0',
    locked TEXT NOT NULL DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, asset)
);

-- DFNS Staking Integrations table
CREATE TABLE IF NOT EXISTS dfns_staking_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staking_id TEXT UNIQUE NOT NULL,
    wallet_id TEXT REFERENCES dfns_wallets(wallet_id) ON DELETE CASCADE,
    network TEXT NOT NULL,
    validator_address TEXT,
    delegation_amount TEXT NOT NULL DEFAULT '0',
    status TEXT NOT NULL CHECK (status IN ('Delegated', 'Undelegating', 'Undelegated', 'Slashed')),
    total_rewards TEXT NOT NULL DEFAULT '0',
    pending_rewards TEXT NOT NULL DEFAULT '0',
    claimed_rewards TEXT NOT NULL DEFAULT '0',
    last_reward_at TIMESTAMP WITH TIME ZONE,
    last_claim_at TIMESTAMP WITH TIME ZONE,
    apr TEXT,
    unstaking_period TEXT,
    dfns_staking_id TEXT UNIQUE, -- DFNS internal staking ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DFNS Fee Sponsor Tables
-- =====================================================

-- DFNS Fee Sponsors table
CREATE TABLE IF NOT EXISTS dfns_fee_sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sponsor_address TEXT NOT NULL,
    network TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Depleted')),
    balance TEXT NOT NULL DEFAULT '0',
    spent_amount TEXT NOT NULL DEFAULT '0',
    transaction_count INTEGER DEFAULT 0,
    external_id TEXT,
    organization_id TEXT,
    dfns_sponsor_id TEXT UNIQUE, -- DFNS internal sponsor ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Sponsored Fees table
CREATE TABLE IF NOT EXISTS dfns_sponsored_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsored_fee_id TEXT UNIQUE NOT NULL,
    fee_sponsor_id TEXT REFERENCES dfns_fee_sponsors(sponsor_id) ON DELETE CASCADE,
    wallet_id TEXT REFERENCES dfns_wallets(wallet_id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL,
    amount TEXT NOT NULL,
    asset TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sponsored', 'Failed')),
    sponsored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DFNS Validator Tables
-- =====================================================

-- DFNS Validators table (for caching)
CREATE TABLE IF NOT EXISTS dfns_validators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validator_address TEXT NOT NULL,
    network TEXT NOT NULL,
    name TEXT,
    commission TEXT NOT NULL DEFAULT '0',
    delegated_amount TEXT NOT NULL DEFAULT '0',
    status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive', 'Jailed')),
    apr TEXT,
    uptime TEXT,
    rank INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(validator_address, network)
);

-- =====================================================
-- DFNS Activity & Audit Tables
-- =====================================================

-- DFNS Activity Logs table
CREATE TABLE IF NOT EXISTS dfns_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    organization_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS API Requests table (for debugging and monitoring)
CREATE TABLE IF NOT EXISTS dfns_api_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_id TEXT,
    request_body JSONB,
    response_body JSONB,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    user_id TEXT,
    organization_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DFNS Sync Status table (for tracking sync operations)
CREATE TABLE IF NOT EXISTS dfns_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL, -- wallets, transactions, balances, etc.
    entity_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'in_progress')),
    error_message TEXT,
    next_sync_at TIMESTAMP WITH TIME ZONE,
    organization_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_type, entity_id)
);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_dfns_applications_app_id ON dfns_applications(app_id);
CREATE INDEX IF NOT EXISTS idx_dfns_applications_status ON dfns_applications(status);
CREATE INDEX IF NOT EXISTS idx_dfns_applications_organization_id ON dfns_applications(organization_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_dfns_users_username ON dfns_users(username);
CREATE INDEX IF NOT EXISTS idx_dfns_users_email ON dfns_users(email);
CREATE INDEX IF NOT EXISTS idx_dfns_users_status ON dfns_users(status);
CREATE INDEX IF NOT EXISTS idx_dfns_users_dfns_user_id ON dfns_users(dfns_user_id);

-- Credentials indexes
CREATE INDEX IF NOT EXISTS idx_dfns_credentials_user_id ON dfns_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_dfns_credentials_credential_id ON dfns_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_dfns_credentials_status ON dfns_credentials(status);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_dfns_wallets_wallet_id ON dfns_wallets(wallet_id);
CREATE INDEX IF NOT EXISTS idx_dfns_wallets_network ON dfns_wallets(network);
CREATE INDEX IF NOT EXISTS idx_dfns_wallets_address ON dfns_wallets(address);
CREATE INDEX IF NOT EXISTS idx_dfns_wallets_status ON dfns_wallets(status);
CREATE INDEX IF NOT EXISTS idx_dfns_wallets_project_id ON dfns_wallets(project_id);
CREATE INDEX IF NOT EXISTS idx_dfns_wallets_investor_id ON dfns_wallets(investor_id);

-- Signing keys indexes
CREATE INDEX IF NOT EXISTS idx_dfns_signing_keys_key_id ON dfns_signing_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_dfns_signing_keys_network ON dfns_signing_keys(network);
CREATE INDEX IF NOT EXISTS idx_dfns_signing_keys_status ON dfns_signing_keys(status);

-- Balances indexes
CREATE INDEX IF NOT EXISTS idx_dfns_wallet_balances_wallet_id ON dfns_wallet_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_dfns_wallet_balances_asset_symbol ON dfns_wallet_balances(asset_symbol);

-- Transaction history indexes
CREATE INDEX IF NOT EXISTS idx_dfns_transaction_history_wallet_id ON dfns_transaction_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_dfns_transaction_history_tx_hash ON dfns_transaction_history(tx_hash);
CREATE INDEX IF NOT EXISTS idx_dfns_transaction_history_timestamp ON dfns_transaction_history(timestamp);

-- Transfers indexes
CREATE INDEX IF NOT EXISTS idx_dfns_transfers_transfer_id ON dfns_transfers(transfer_id);
CREATE INDEX IF NOT EXISTS idx_dfns_transfers_wallet_id ON dfns_transfers(wallet_id);
CREATE INDEX IF NOT EXISTS idx_dfns_transfers_status ON dfns_transfers(status);
CREATE INDEX IF NOT EXISTS idx_dfns_transfers_tx_hash ON dfns_transfers(tx_hash);

-- Policies indexes
CREATE INDEX IF NOT EXISTS idx_dfns_policies_policy_id ON dfns_policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_dfns_policies_status ON dfns_policies(status);
CREATE INDEX IF NOT EXISTS idx_dfns_policies_activity_kind ON dfns_policies(activity_kind);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_dfns_activity_logs_activity_type ON dfns_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_dfns_activity_logs_entity_id ON dfns_activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_dfns_activity_logs_entity_type ON dfns_activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_dfns_activity_logs_created_at ON dfns_activity_logs(created_at);

-- API requests indexes
CREATE INDEX IF NOT EXISTS idx_dfns_api_requests_endpoint ON dfns_api_requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_dfns_api_requests_status_code ON dfns_api_requests(status_code);
CREATE INDEX IF NOT EXISTS idx_dfns_api_requests_created_at ON dfns_api_requests(created_at);

-- Sync status indexes
CREATE INDEX IF NOT EXISTS idx_dfns_sync_status_entity_type ON dfns_sync_status(entity_type);
CREATE INDEX IF NOT EXISTS idx_dfns_sync_status_sync_status ON dfns_sync_status(sync_status);
CREATE INDEX IF NOT EXISTS idx_dfns_sync_status_last_sync_at ON dfns_sync_status(last_sync_at);

-- =====================================================
-- Create Updated At Triggers
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all DFNS tables
CREATE TRIGGER update_dfns_applications_updated_at BEFORE UPDATE ON dfns_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_users_updated_at BEFORE UPDATE ON dfns_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_credentials_updated_at BEFORE UPDATE ON dfns_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_service_accounts_updated_at BEFORE UPDATE ON dfns_service_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_personal_access_tokens_updated_at BEFORE UPDATE ON dfns_personal_access_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_signing_keys_updated_at BEFORE UPDATE ON dfns_signing_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_wallets_updated_at BEFORE UPDATE ON dfns_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_wallet_balances_updated_at BEFORE UPDATE ON dfns_wallet_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_wallet_nfts_updated_at BEFORE UPDATE ON dfns_wallet_nfts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_transaction_history_updated_at BEFORE UPDATE ON dfns_transaction_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_transfers_updated_at BEFORE UPDATE ON dfns_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_signatures_updated_at BEFORE UPDATE ON dfns_signatures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_broadcast_transactions_updated_at BEFORE UPDATE ON dfns_broadcast_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_permissions_updated_at BEFORE UPDATE ON dfns_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_permission_assignments_updated_at BEFORE UPDATE ON dfns_permission_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_policies_updated_at BEFORE UPDATE ON dfns_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_policy_approvals_updated_at BEFORE UPDATE ON dfns_policy_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_webhooks_updated_at BEFORE UPDATE ON dfns_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_webhook_deliveries_updated_at BEFORE UPDATE ON dfns_webhook_deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_exchange_integrations_updated_at BEFORE UPDATE ON dfns_exchange_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_exchange_accounts_updated_at BEFORE UPDATE ON dfns_exchange_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_exchange_balances_updated_at BEFORE UPDATE ON dfns_exchange_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_staking_integrations_updated_at BEFORE UPDATE ON dfns_staking_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_fee_sponsors_updated_at BEFORE UPDATE ON dfns_fee_sponsors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_sponsored_fees_updated_at BEFORE UPDATE ON dfns_sponsored_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_validators_updated_at BEFORE UPDATE ON dfns_validators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_activity_logs_updated_at BEFORE UPDATE ON dfns_activity_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_api_requests_updated_at BEFORE UPDATE ON dfns_api_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dfns_sync_status_updated_at BEFORE UPDATE ON dfns_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Setup
-- =====================================================

-- Enable RLS on all DFNS tables
ALTER TABLE dfns_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_service_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_personal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_signing_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_wallet_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_broadcast_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_permission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_policy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_exchange_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_exchange_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_exchange_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_staking_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_fee_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_sponsored_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_validators ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dfns_sync_status ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allowing authenticated users to access their organization's data)
-- Note: Adjust these policies based on your specific security requirements

CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_applications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_credentials FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_service_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_personal_access_tokens FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_signing_keys FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_wallets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_wallet_balances FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_wallet_nfts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_transaction_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_transfers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_signatures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_broadcast_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_permission_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_policies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_policy_approvals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_webhooks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_webhook_deliveries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_exchange_integrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_exchange_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_exchange_balances FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_staking_integrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_fee_sponsors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_sponsored_fees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_validators FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_api_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to view DFNS data" ON dfns_sync_status FOR SELECT USING (auth.role() = 'authenticated');

-- Insert/Update/Delete policies for service role (backend operations)
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_applications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_credentials FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_service_accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_personal_access_tokens FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_signing_keys FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_wallets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_wallet_balances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_wallet_nfts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_transaction_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_transfers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_signatures FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_broadcast_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_permissions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_permission_assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_policies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_policy_approvals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_webhooks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_webhook_deliveries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_exchange_integrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_exchange_accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_exchange_balances FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_staking_integrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_fee_sponsors FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_sponsored_fees FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_validators FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_activity_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_api_requests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage DFNS data" ON dfns_sync_status FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- Migration Complete
-- =====================================================

-- Insert migration record
INSERT INTO migrations (filename, completed_at) 
VALUES ('20250605000001_create_dfns_tables.sql', NOW())
ON CONFLICT (filename) DO NOTHING;

-- Add COMMENT to track migration
COMMENT ON SCHEMA public IS 'DFNS Integration Tables Created - Migration 20250605000001 - June 5, 2025';
