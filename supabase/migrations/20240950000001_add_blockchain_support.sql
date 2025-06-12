-- Add support for additional blockchains in the multi_sig_wallets table

-- First, ensure the multi_sig_wallets table exists
CREATE TABLE IF NOT EXISTS multi_sig_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  address TEXT NOT NULL,
  owners TEXT[] NOT NULL,
  threshold INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add a check constraint to ensure only supported blockchains are used
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'multi_sig_wallets_blockchain_check'
  ) THEN
    ALTER TABLE multi_sig_wallets ADD CONSTRAINT multi_sig_wallets_blockchain_check 
    CHECK (blockchain IN (
      'ethereum', 'polygon', 'avalanche', 'optimism', 'solana', 'bitcoin', 
      'ripple', 'aptos', 'sui', 'mantle', 'stellar', 'hedera', 'base', 
      'zksync', 'arbitrum', 'near'
    ));
  END IF;
END $$;

-- Add an index on the blockchain column for faster queries
CREATE INDEX IF NOT EXISTS multi_sig_wallets_blockchain_idx ON multi_sig_wallets(blockchain);

-- Enable RLS on the table
ALTER TABLE multi_sig_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for the multi_sig_wallets table
DROP POLICY IF EXISTS "Users can view their own wallets" ON multi_sig_wallets;
CREATE POLICY "Users can view their own wallets"
  ON multi_sig_wallets FOR SELECT
  USING (created_by = auth.uid() OR auth.uid()::text = ANY(owners));

DROP POLICY IF EXISTS "Users can insert their own wallets" ON multi_sig_wallets;
CREATE POLICY "Users can insert their own wallets"
  ON multi_sig_wallets FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own wallets" ON multi_sig_wallets;
CREATE POLICY "Users can update their own wallets"
  ON multi_sig_wallets FOR UPDATE
  USING (created_by = auth.uid() OR auth.uid()::text = ANY(owners));

DROP POLICY IF EXISTS "Users can delete their own wallets" ON multi_sig_wallets;
CREATE POLICY "Users can delete their own wallets"
  ON multi_sig_wallets FOR DELETE
  USING (created_by = auth.uid());

-- Add blockchain-specific fields to the multi_sig_transactions table
ALTER TABLE IF EXISTS multi_sig_transactions
  ADD COLUMN IF NOT EXISTS blockchain_specific_data JSONB;

-- Add an index on the blockchain column for faster queries
CREATE INDEX IF NOT EXISTS multi_sig_transactions_blockchain_idx 
  ON multi_sig_transactions(blockchain);

-- Add a function to validate blockchain addresses based on the blockchain type
CREATE OR REPLACE FUNCTION validate_blockchain_address(blockchain TEXT, address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Ethereum, Polygon, Avalanche, Optimism, Base, ZkSync, Arbitrum, Mantle, Hedera (EVM-compatible)
  IF blockchain IN ('ethereum', 'polygon', 'avalanche', 'optimism', 'base', 'zksync', 'arbitrum', 'mantle', 'hedera') THEN
    RETURN address ~* '^0x[a-fA-F0-9]{40}$';
  -- Bitcoin
  ELSIF blockchain = 'bitcoin' THEN
    RETURN address ~* '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$';
  -- Ripple (XRP)
  ELSIF blockchain = 'ripple' THEN
    RETURN address ~* '^r[a-zA-Z0-9]{24,34}$';
  -- Solana
  ELSIF blockchain = 'solana' THEN
    RETURN address ~* '^[1-9A-HJ-NP-Za-km-z]{32,44}$';
  -- Aptos
  ELSIF blockchain = 'aptos' THEN
    RETURN address ~* '^0x[a-fA-F0-9]{1,64}$';
  -- Sui
  ELSIF blockchain = 'sui' THEN
    RETURN address ~* '^0x[a-fA-F0-9]{1,64}$';
  -- Stellar
  ELSIF blockchain = 'stellar' THEN
    RETURN address ~* '^G[A-Z0-9]{55}$';
  -- NEAR
  ELSIF blockchain = 'near' THEN
    RETURN address ~* '^[a-z0-9_-]{2,64}(\.near)?$';
  -- Default case for unsupported blockchains
  ELSE
    RETURN TRUE; -- Allow any address format for unsupported blockchains
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to validate addresses when inserting or updating wallets
CREATE OR REPLACE FUNCTION validate_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validate_blockchain_address(NEW.blockchain, NEW.address) THEN
    RAISE EXCEPTION 'Invalid address format for blockchain %', NEW.blockchain;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_wallet_address_trigger'
  ) THEN
    CREATE TRIGGER validate_wallet_address_trigger
    BEFORE INSERT OR UPDATE ON multi_sig_wallets
    FOR EACH ROW
    EXECUTE FUNCTION validate_wallet_address();
  END IF;
END $$;
