-- Create multisig_wallets table
CREATE TABLE IF NOT EXISTS multisig_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Foreign key referencing auth.users(id)
    organization_id UUID,
    contract_address TEXT,
    signers TEXT[] NOT NULL,
    required_confirmations INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create multisig_transactions table
CREATE TABLE IF NOT EXISTS multisig_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES multisig_wallets(id) ON DELETE CASCADE,
    to_address TEXT NOT NULL,
    from_address TEXT NOT NULL,
    value TEXT NOT NULL,
    data TEXT,
    gas_limit TEXT,
    gas_price TEXT,
    nonce INTEGER,
    chain_id INTEGER,
    hash TEXT,
    status TEXT DEFAULT 'pending',
    description TEXT,
    executed BOOLEAN DEFAULT false,
    confirmations INTEGER DEFAULT 0,
    required INTEGER,
    created_by TEXT,
    tx_hash TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    block_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create multisig_confirmations table
CREATE TABLE IF NOT EXISTS multisig_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES multisig_transactions(id) ON DELETE CASCADE,
    signer TEXT NOT NULL,
    signature TEXT,
    confirmed BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_multisig_wallets_owner_id ON multisig_wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_multisig_transactions_wallet_id ON multisig_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_multisig_confirmations_transaction_id ON multisig_confirmations(transaction_id);