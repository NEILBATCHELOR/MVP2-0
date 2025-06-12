-- Create multisig_wallets table
CREATE TABLE IF NOT EXISTS multisig_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  address TEXT NOT NULL,
  signers TEXT[] NOT NULL,
  threshold INTEGER NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for multisig_wallets
ALTER TABLE multisig_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own multisig wallets"
  ON multisig_wallets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own multisig wallets"
  ON multisig_wallets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own multisig wallets"
  ON multisig_wallets FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own multisig wallets"
  ON multisig_wallets FOR DELETE
  USING (auth.uid() = owner_id);

-- Create multisig_proposals table
CREATE TABLE IF NOT EXISTS multisig_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES multisig_wallets(id) ON DELETE CASCADE,
  to_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  token TEXT NOT NULL,
  data TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies for multisig_proposals
ALTER TABLE multisig_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposals for their wallets"
  ON multisig_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multisig_wallets
      WHERE multisig_wallets.id = multisig_proposals.wallet_id
      AND multisig_wallets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert proposals for their wallets"
  ON multisig_proposals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multisig_wallets
      WHERE multisig_wallets.id = multisig_proposals.wallet_id
      AND multisig_wallets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update proposals for their wallets"
  ON multisig_proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM multisig_wallets
      WHERE multisig_wallets.id = multisig_proposals.wallet_id
      AND multisig_wallets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete proposals for their wallets"
  ON multisig_proposals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM multisig_wallets
      WHERE multisig_wallets.id = multisig_proposals.wallet_id
      AND multisig_wallets.owner_id = auth.uid()
    )
  );

-- Create multisig_signatures table
CREATE TABLE IF NOT EXISTS multisig_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES multisig_proposals(id) ON DELETE CASCADE,
  signer_address TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for multisig_signatures
ALTER TABLE multisig_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures for their proposals"
  ON multisig_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multisig_proposals
      JOIN multisig_wallets ON multisig_wallets.id = multisig_proposals.wallet_id
      WHERE multisig_proposals.id = multisig_signatures.proposal_id
      AND multisig_wallets.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert signatures for their proposals"
  ON multisig_signatures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multisig_proposals
      JOIN multisig_wallets ON multisig_wallets.id = multisig_proposals.wallet_id
      WHERE multisig_proposals.id = multisig_signatures.proposal_id
      AND multisig_wallets.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_multisig_wallets_owner_id ON multisig_wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_multisig_proposals_wallet_id ON multisig_proposals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_multisig_signatures_proposal_id ON multisig_signatures(proposal_id); 