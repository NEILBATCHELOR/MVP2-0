-- Create investors table if it doesn't exist
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'individual',
  status TEXT DEFAULT 'pending',
  kyc_status TEXT DEFAULT 'not_started',
  accreditation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all investors" ON investors;
CREATE POLICY "Users can view all investors"
  ON investors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert investors" ON investors;
CREATE POLICY "Users can insert investors"
  ON investors FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update investors" ON investors;
CREATE POLICY "Users can update investors"
  ON investors FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete investors" ON investors;
CREATE POLICY "Users can delete investors"
  ON investors FOR DELETE
  USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE investors;
