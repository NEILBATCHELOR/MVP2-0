-- Create enhanced cap table schema

-- Projects table with enhanced fields
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  authorized_shares BIGINT,
  share_price DECIMAL(18, 8),
  project_type VARCHAR,
  token_symbol VARCHAR,
  company_valuation BIGINT,
  funding_round VARCHAR,
  legal_entity VARCHAR,
  jurisdiction VARCHAR,
  tax_id VARCHAR
);

-- Investors table with enhanced fields
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  company VARCHAR,
  investor_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  kyc_status VARCHAR DEFAULT 'not_started',
  kyc_expiry_date TIMESTAMP WITH TIME ZONE,
  verification_details JSONB,
  wallet_address VARCHAR
);

-- Subscriptions table for investor allocations
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(id),
  project_id UUID REFERENCES projects(id),
  subscription_id VARCHAR NOT NULL,
  subscription_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  security_type VARCHAR NOT NULL,
  fiat_amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR NOT NULL DEFAULT 'USD',
  status VARCHAR NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT FALSE,
  allocated BOOLEAN DEFAULT FALSE,
  distributed BOOLEAN DEFAULT FALSE,
  
  -- Security-specific fields
  conversion_cap DECIMAL(18, 2),
  conversion_discount DECIMAL(5, 2),
  interest_rate DECIMAL(5, 2),
  maturity_date TIMESTAMP WITH TIME ZONE,
  pro_rata_rights BOOLEAN DEFAULT FALSE,
  voting_rights BOOLEAN DEFAULT FALSE,
  liquidation_preference DECIMAL(5, 2),
  participation_multiple DECIMAL(5, 2)
);

-- Token allocations table
CREATE TABLE IF NOT EXISTS token_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  token_amount DECIMAL(18, 8) NOT NULL,
  token_type VARCHAR NOT NULL,
  distributed BOOLEAN DEFAULT FALSE,
  distribution_date TIMESTAMP WITH TIME ZONE,
  distribution_tx_hash VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cap tables for projects
CREATE TABLE IF NOT EXISTS cap_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cap table investors junction table
CREATE TABLE IF NOT EXISTS cap_table_investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cap_table_id UUID REFERENCES cap_tables(id),
  investor_id UUID NOT NULL REFERENCES investors(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investor groups for organizing investors
CREATE TABLE IF NOT EXISTS investor_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investor groups junction table
CREATE TABLE IF NOT EXISTS investor_groups_investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES investor_groups(id),
  investor_id UUID NOT NULL REFERENCES investors(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for investor subscriptions
CREATE OR REPLACE VIEW investor_subscriptions_view AS
SELECT 
  i.id AS investor_id,
  i.name AS investor_name,
  i.email AS investor_email,
  i.investor_type,
  i.kyc_status,
  i.wallet_address,
  s.subscription_id,
  s.security_type,
  s.fiat_amount,
  s.status,
  s.confirmed,
  s.allocated,
  s.distributed,
  ta.token_amount,
  ta.token_type
FROM investors i
LEFT JOIN subscriptions s ON i.id = s.investor_id
LEFT JOIN token_allocations ta ON s.id = ta.subscription_id;

-- Enable realtime for all tables
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table investors;
alter publication supabase_realtime add table subscriptions;
alter publication supabase_realtime add table token_allocations;
alter publication supabase_realtime add table cap_tables;
alter publication supabase_realtime add table cap_table_investors;
alter publication supabase_realtime add table investor_groups;
alter publication supabase_realtime add table investor_groups_investors;
