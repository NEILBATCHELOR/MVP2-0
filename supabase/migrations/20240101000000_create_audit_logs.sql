-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  user TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL,
  signature TEXT,
  verified BOOLEAN DEFAULT FALSE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs (status);

-- Add RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow inserts and selects, no updates or deletes to maintain audit integrity
CREATE POLICY "Allow inserts for authenticated users" 
  ON audit_logs FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow reads for authenticated users" 
  ON audit_logs FOR SELECT 
  TO authenticated 
  USING (true);
