-- Create tables for redemption requests and approvals

-- Redemption requests table
CREATE TABLE IF NOT EXISTS redemption_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_amount NUMERIC NOT NULL,
  token_type TEXT NOT NULL,
  redemption_type TEXT NOT NULL,
  status TEXT NOT NULL,
  source_wallet_address TEXT NOT NULL,
  destination_wallet_address TEXT NOT NULL,
  conversion_rate NUMERIC NOT NULL,
  investor_name TEXT,
  investor_id TEXT,
  required_approvals INTEGER NOT NULL DEFAULT 1,
  is_bulk_redemption BOOLEAN DEFAULT FALSE,
  investor_count INTEGER DEFAULT 1,
  rejection_reason TEXT,
  rejected_by TEXT,
  rejection_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Redemption approvers table
CREATE TABLE IF NOT EXISTS redemption_approvers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  redemption_id UUID NOT NULL REFERENCES redemption_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE redemption_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE redemption_approvers;
