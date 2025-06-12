-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  project_type TEXT NOT NULL,
  token_symbol TEXT,
  target_raise NUMERIC,
  authorized_shares INTEGER,
  share_price NUMERIC,
  company_valuation NUMERIC,
  funding_round TEXT,
  legal_entity TEXT,
  jurisdiction TEXT,
  tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_id UUID
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for projects
DROP POLICY IF EXISTS "Users can CRUD their own projects" ON projects;
CREATE POLICY "Users can CRUD their own projects"
  ON projects
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
