-- Create token_designs table
CREATE TABLE IF NOT EXISTS token_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  total_supply BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  minted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, token_type)
);

-- Create cap_tables table
CREATE TABLE IF NOT EXISTS cap_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Create cap_table_investors table
CREATE TABLE IF NOT EXISTS cap_table_investors (
  cap_table_id UUID NOT NULL REFERENCES cap_tables(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cap_table_id, investor_id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL,
  fiat_amount NUMERIC(20, 2) NOT NULL DEFAULT 0,
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  allocated BOOLEAN NOT NULL DEFAULT FALSE,
  allocation_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  distributed BOOLEAN NOT NULL DEFAULT FALSE,
  distribution_date TIMESTAMPTZ,
  distribution_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE token_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_table_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access for token_designs"
  ON token_designs FOR SELECT
  USING (true);

CREATE POLICY "Public insert access for token_designs"
  ON token_designs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access for token_designs"
  ON token_designs FOR UPDATE
  USING (true);

CREATE POLICY "Public read access for cap_tables"
  ON cap_tables FOR SELECT
  USING (true);

CREATE POLICY "Public insert access for cap_tables"
  ON cap_tables FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access for cap_tables"
  ON cap_tables FOR UPDATE
  USING (true);

CREATE POLICY "Public read access for cap_table_investors"
  ON cap_table_investors FOR SELECT
  USING (true);

CREATE POLICY "Public insert access for cap_table_investors"
  ON cap_table_investors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public delete access for cap_table_investors"
  ON cap_table_investors FOR DELETE
  USING (true);

CREATE POLICY "Public read access for subscriptions"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Public insert access for subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access for subscriptions"
  ON subscriptions FOR UPDATE
  USING (true);

CREATE POLICY "Public delete access for subscriptions"
  ON subscriptions FOR DELETE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE token_designs;
ALTER PUBLICATION supabase_realtime ADD TABLE cap_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE cap_table_investors;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
