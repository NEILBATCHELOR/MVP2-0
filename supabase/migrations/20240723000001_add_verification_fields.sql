-- Add verification fields to investors table if they don't exist
ALTER TABLE investors ADD COLUMN IF NOT EXISTS verification_details JSONB DEFAULT NULL;

-- Create audit log for KYC/AML screening activities
CREATE TABLE IF NOT EXISTS kyc_screening_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT,
  method TEXT NOT NULL,
  notes TEXT,
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row level security
ALTER TABLE kyc_screening_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for kyc_screening_logs
CREATE POLICY "Public read access for kyc_screening_logs"
  ON kyc_screening_logs FOR SELECT
  USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE kyc_screening_logs;
