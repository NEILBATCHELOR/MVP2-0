-- Create multi-sig wallet tables

-- Multi-sig wallets table
CREATE TABLE IF NOT EXISTS multi_sig_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  address TEXT NOT NULL,
  owners TEXT[] NOT NULL,
  threshold INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-sig transactions table
CREATE TABLE IF NOT EXISTS multi_sig_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES multi_sig_wallets(id) ON DELETE CASCADE,
  to TEXT NOT NULL,
  value TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '0x',
  nonce INTEGER NOT NULL,
  hash TEXT NOT NULL,
  executed BOOLEAN NOT NULL DEFAULT FALSE,
  confirmations INTEGER NOT NULL DEFAULT 0,
  blockchain TEXT NOT NULL,
  token_address TEXT,
  token_symbol TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-sig confirmations table
CREATE TABLE IF NOT EXISTS multi_sig_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES multi_sig_transactions(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE multi_sig_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_sig_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_sig_confirmations ENABLE ROW LEVEL SECURITY;

-- Create policies for multi_sig_wallets
CREATE POLICY "Users can view their own wallets or wallets they sign"
  ON multi_sig_wallets
  FOR SELECT
  USING (auth.uid() = created_by OR auth.uid()::text = ANY(owners));

CREATE POLICY "Users can insert their own wallets"
  ON multi_sig_wallets
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own wallets"
  ON multi_sig_wallets
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own wallets"
  ON multi_sig_wallets
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create policies for multi_sig_transactions
CREATE POLICY "Users can view transactions for wallets they own or sign"
  ON multi_sig_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multi_sig_wallets
      WHERE multi_sig_wallets.id = multi_sig_transactions.wallet_id
      AND (multi_sig_wallets.created_by = auth.uid() OR auth.uid()::text = ANY(multi_sig_wallets.owners))
    )
  );

CREATE POLICY "Users can insert transactions for wallets they own or sign"
  ON multi_sig_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multi_sig_wallets
      WHERE multi_sig_wallets.id = multi_sig_transactions.wallet_id
      AND (multi_sig_wallets.created_by = auth.uid() OR auth.uid()::text = ANY(multi_sig_wallets.owners))
    )
  );

CREATE POLICY "Users can update transactions for wallets they own or sign"
  ON multi_sig_transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM multi_sig_wallets
      WHERE multi_sig_wallets.id = multi_sig_transactions.wallet_id
      AND (multi_sig_wallets.created_by = auth.uid() OR auth.uid()::text = ANY(multi_sig_wallets.owners))
    )
  );

-- Create policies for multi_sig_confirmations
CREATE POLICY "Users can view confirmations for transactions they can see"
  ON multi_sig_confirmations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multi_sig_transactions
      JOIN multi_sig_wallets ON multi_sig_wallets.id = multi_sig_transactions.wallet_id
      WHERE multi_sig_transactions.id = multi_sig_confirmations.transaction_id
      AND (multi_sig_wallets.created_by = auth.uid() OR auth.uid()::text = ANY(multi_sig_wallets.owners))
    )
  );

CREATE POLICY "Users can insert confirmations for transactions they can sign"
  ON multi_sig_confirmations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multi_sig_transactions
      JOIN multi_sig_wallets ON multi_sig_wallets.id = multi_sig_transactions.wallet_id
      WHERE multi_sig_transactions.id = multi_sig_confirmations.transaction_id
      AND auth.uid()::text = ANY(multi_sig_wallets.owners)
    )
  );

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE multi_sig_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE multi_sig_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE multi_sig_confirmations;
