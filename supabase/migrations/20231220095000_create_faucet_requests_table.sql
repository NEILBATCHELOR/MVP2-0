-- Create a table for tracking testnet faucet requests
CREATE TABLE IF NOT EXISTS faucet_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  token_address TEXT,  -- NULL for native tokens like ETH
  amount TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  transaction_hash TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_faucet_requests_wallet_address ON faucet_requests(wallet_address);

-- Create an index on timestamp for date-based queries
CREATE INDEX IF NOT EXISTS idx_faucet_requests_created_at ON faucet_requests(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_faucet_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS set_faucet_requests_updated_at ON faucet_requests;
CREATE TRIGGER set_faucet_requests_updated_at
BEFORE UPDATE ON faucet_requests
FOR EACH ROW
EXECUTE FUNCTION update_faucet_requests_updated_at();