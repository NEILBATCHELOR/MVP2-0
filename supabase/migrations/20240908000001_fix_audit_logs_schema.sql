-- Check if the audit_logs table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  user_email TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL,
  signature TEXT,
  verified BOOLEAN DEFAULT FALSE
);

-- Enable row level security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit_logs
DROP POLICY IF EXISTS "Allow all access to audit_logs" ON audit_logs;
CREATE POLICY "Allow all access to audit_logs"
  ON audit_logs
  USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
