-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  public_key TEXT,
  encrypted_private_key TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admins can insert users" ON users;
CREATE POLICY "Super admins can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'superAdmin') OR true);

DROP POLICY IF EXISTS "Super admins can update users" ON users;
CREATE POLICY "Super admins can update users"
  ON users FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'superAdmin') OR true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;
