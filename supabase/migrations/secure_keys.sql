-- Development-only table for encrypted keys
-- In production, keys would be stored in HSM, not in the database
CREATE TABLE IF NOT EXISTS secure_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_id TEXT UNIQUE NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies for secure keys
ALTER TABLE secure_keys ENABLE ROW LEVEL SECURITY;

-- Only system admins can access secure keys
CREATE POLICY "Admin users can access secure_keys" ON secure_keys
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE is_system_admin = true
    )
  );

-- Add policies to prevent unauthorized access
CREATE POLICY "Service role can access secure_keys" ON secure_keys
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');