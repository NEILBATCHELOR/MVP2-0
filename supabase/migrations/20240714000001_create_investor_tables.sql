-- Create investors table if it doesn't exist
CREATE TABLE IF NOT EXISTS investors (
  investor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  type TEXT NOT NULL DEFAULT 'hnwi',
  kyc_status TEXT NOT NULL DEFAULT 'not_started',
  kyc_expiry_date TIMESTAMP WITH TIME ZONE,
  wallet_address TEXT,
  notes TEXT,
  verification_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

-- Create policy for investors table
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON investors;
CREATE POLICY "Allow full access to authenticated users"
  ON investors
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table investors;
