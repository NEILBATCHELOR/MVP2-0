-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  token_type TEXT NOT NULL,
  target_raise NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create cap_tables table if it doesn't exist
CREATE TABLE IF NOT EXISTS cap_tables (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cap_table_investors table if it doesn't exist
CREATE TABLE IF NOT EXISTS cap_table_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cap_table_id UUID NOT NULL REFERENCES cap_tables(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cap_table_id, investor_id)
);

-- Enable row-level security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_table_investors ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
DROP POLICY IF EXISTS "Public projects access" ON projects;
CREATE POLICY "Public projects access"
  ON projects
  USING (true);

-- Create policies for cap_tables
DROP POLICY IF EXISTS "Public cap_tables access" ON cap_tables;
CREATE POLICY "Public cap_tables access"
  ON cap_tables
  USING (true);

-- Create policies for cap_table_investors
DROP POLICY IF EXISTS "Public cap_table_investors access" ON cap_table_investors;
CREATE POLICY "Public cap_table_investors access"
  ON cap_table_investors
  USING (true);

-- Enable realtime for these tables
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table cap_tables;
alter publication supabase_realtime add table cap_table_investors;
