-- Fixed Migration script for wallet infrastructure enhancements
-- Addresses missing transactions table and other schema issues

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.ripple_payments CASCADE;
DROP TABLE IF EXISTS public.moonpay_transactions CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;

-- Create transactions table first (since it's missing from the schema)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_hash TEXT UNIQUE NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    token_symbol TEXT,
    token_address TEXT,
    blockchain TEXT NOT NULL DEFAULT 'ethereum',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    type TEXT NOT NULL DEFAULT 'transfer' CHECK (type IN ('transfer', 'token_transfer', 'nft_transfer')),
    gas_used NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- New enhanced columns
    gas_limit NUMERIC,
    gas_price NUMERIC,
    max_fee_per_gas NUMERIC,
    max_priority_fee_per_gas NUMERIC,
    block_number INTEGER,
    block_hash TEXT,
    transaction_index INTEGER,
    confirmations INTEGER DEFAULT 0,
    memo TEXT,
    destination_tag INTEGER,
    transfer_type TEXT DEFAULT 'standard' CHECK (transfer_type IN ('standard', 'token', 'nft', 'multisig')),
    network_fee NUMERIC,
    estimated_confirmation_time INTERVAL
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX idx_transactions_from_address ON public.transactions(from_address);
CREATE INDEX idx_transactions_to_address ON public.transactions(to_address);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_blockchain ON public.transactions(blockchain);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

-- Create Ripple payments table
CREATE TABLE public.ripple_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash TEXT NOT NULL UNIQUE,
    from_account TEXT NOT NULL,
    to_account TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'XRP',
    fee NUMERIC DEFAULT 0.000012,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'failed')),
    ledger_index INTEGER,
    sequence_number INTEGER,
    destination_tag INTEGER,
    source_tag INTEGER,
    memo TEXT,
    payment_type TEXT DEFAULT 'standard' CHECK (payment_type IN ('standard', 'cross_border', 'domestic')),
    from_country TEXT,
    to_country TEXT,
    exchange_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Ripple payments
CREATE INDEX idx_ripple_payments_hash ON public.ripple_payments(hash);
CREATE INDEX idx_ripple_payments_from_account ON public.ripple_payments(from_account);
CREATE INDEX idx_ripple_payments_to_account ON public.ripple_payments(to_account);
CREATE INDEX idx_ripple_payments_status ON public.ripple_payments(status);
CREATE INDEX idx_ripple_payments_created_at ON public.ripple_payments(created_at);

-- Create Moonpay transactions table
CREATE TABLE public.moonpay_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_transaction_id TEXT UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'waitingPayment', 'waitingAuthorization')),
    crypto_currency TEXT NOT NULL,
    fiat_currency TEXT NOT NULL,
    crypto_amount NUMERIC,
    fiat_amount NUMERIC NOT NULL,
    wallet_address TEXT,
    payment_method TEXT,
    customer_id TEXT,
    redirect_url TEXT,
    widget_redirect_url TEXT,
    fees JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Moonpay transactions
CREATE INDEX idx_moonpay_transactions_external_id ON public.moonpay_transactions(external_transaction_id);
CREATE INDEX idx_moonpay_transactions_type ON public.moonpay_transactions(type);
CREATE INDEX idx_moonpay_transactions_status ON public.moonpay_transactions(status);
CREATE INDEX idx_moonpay_transactions_wallet_address ON public.moonpay_transactions(wallet_address);
CREATE INDEX idx_moonpay_transactions_customer_id ON public.moonpay_transactions(customer_id);
CREATE INDEX idx_moonpay_transactions_created_at ON public.moonpay_transactions(created_at);

-- Create transfer history view
CREATE OR REPLACE VIEW public.transfer_history AS
SELECT 
    t.id,
    t.transaction_hash as hash,
    t.from_address,
    t.to_address,
    t.value as amount,
    t.token_symbol as asset,
    t.blockchain,
    t.status,
    t.type as transfer_type,
    t.network_fee,
    t.gas_used,
    t.block_number,
    t.confirmations,
    t.memo,
    t.created_at,
    t.updated_at
FROM public.transactions t
WHERE t.type IN ('transfer', 'token_transfer', 'nft_transfer')
ORDER BY t.created_at DESC;

-- Create triggers for updated_at timestamps using existing function
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ripple_payments_updated_at 
    BEFORE UPDATE ON public.ripple_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_moonpay_transactions_updated_at 
    BEFORE UPDATE ON public.moonpay_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.ripple_payments TO authenticated;
GRANT ALL ON public.moonpay_transactions TO authenticated;
GRANT ALL ON public.transfer_history TO authenticated;

-- Create composite indexes for common queries
CREATE INDEX idx_transactions_composite ON public.transactions(from_address, status, created_at);
CREATE INDEX idx_ripple_payments_composite ON public.ripple_payments(from_account, status, created_at);
CREATE INDEX idx_moonpay_transactions_composite ON public.moonpay_transactions(wallet_address, type, status, created_at);

-- Add comment documentation
COMMENT ON TABLE public.transactions IS 'General blockchain transactions table for tracking transfers and operations';
COMMENT ON TABLE public.ripple_payments IS 'Stores Ripple/XRP payment transactions including cross-border payments via ODL';
COMMENT ON TABLE public.moonpay_transactions IS 'Stores Moonpay buy/sell transactions for fiat-to-crypto operations';
COMMENT ON VIEW public.transfer_history IS 'Unified view of all transfer transactions across different blockchains';

-- Migration complete