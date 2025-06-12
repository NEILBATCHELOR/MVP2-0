-- Create the tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  standard TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  decimals INTEGER,
  total_supply TEXT,
  is_mintable BOOLEAN DEFAULT TRUE,
  is_burnable BOOLEAN DEFAULT FALSE,
  is_pausable BOOLEAN DEFAULT FALSE,
  is_snapshottable BOOLEAN DEFAULT FALSE,
  is_votes BOOLEAN DEFAULT FALSE,
  is_flash_mintable BOOLEAN DEFAULT FALSE,
  is_enumerable BOOLEAN DEFAULT FALSE,
  is_uri_storage BOOLEAN DEFAULT FALSE,
  base_uri TEXT,
  access_control_type TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id),
  features TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_id UUID
);

-- Create token deployments table
CREATE TABLE IF NOT EXISTS token_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  network TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  deployer_address TEXT NOT NULL,
  transaction_hash TEXT,
  contract_version TEXT,
  deployment_args JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token versions table for version history
CREATE TABLE IF NOT EXISTS token_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  changes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token templates table
CREATE TABLE IF NOT EXISTS token_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  standard TEXT NOT NULL,
  decimals INTEGER,
  is_mintable BOOLEAN DEFAULT TRUE,
  is_burnable BOOLEAN DEFAULT FALSE,
  is_pausable BOOLEAN DEFAULT FALSE, 
  is_snapshottable BOOLEAN DEFAULT FALSE,
  is_votes BOOLEAN DEFAULT FALSE,
  is_flash_mintable BOOLEAN DEFAULT FALSE,
  is_enumerable BOOLEAN DEFAULT FALSE,
  is_uri_storage BOOLEAN DEFAULT FALSE,
  base_uri TEXT,
  access_control_type TEXT,
  features TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token documents table
CREATE TABLE IF NOT EXISTS token_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_tokens_project_id ON tokens (project_id);
CREATE INDEX idx_token_deployments_token_id ON token_deployments (token_id);
CREATE INDEX idx_token_versions_token_id ON token_versions (token_id);
CREATE INDEX idx_token_templates_project_id ON token_templates (project_id);
CREATE INDEX idx_token_documents_token_id ON token_documents (token_id);

-- Add RLS policies

-- Tokens table policies
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY tokens_select ON tokens
  FOR SELECT USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = tokens.project_id
    )
  );

CREATE POLICY tokens_insert ON tokens
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = tokens.project_id AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY tokens_update ON tokens
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = tokens.project_id AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY tokens_delete ON tokens
  FOR DELETE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = tokens.project_id AND role IN ('owner', 'admin')
    )
  );

-- Token deployments table policies
ALTER TABLE token_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_deployments_select ON token_deployments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_deployments.token_id)
    )
  );

CREATE POLICY token_deployments_insert ON token_deployments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_deployments.token_id)
      AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY token_deployments_update ON token_deployments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_deployments.token_id)
      AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY token_deployments_delete ON token_deployments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_deployments.token_id)
      AND role IN ('owner', 'admin')
    )
  );

-- Token versions table policies
ALTER TABLE token_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_versions_select ON token_versions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_versions.token_id)
    )
  );

CREATE POLICY token_versions_insert ON token_versions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_versions.token_id)
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Token templates table policies
ALTER TABLE token_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_templates_select ON token_templates
  FOR SELECT USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = token_templates.project_id
    )
  );

CREATE POLICY token_templates_insert ON token_templates
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = token_templates.project_id AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY token_templates_update ON token_templates
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = token_templates.project_id AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY token_templates_delete ON token_templates
  FOR DELETE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = token_templates.project_id AND role IN ('owner', 'admin')
    )
  );

-- Token documents table policies
ALTER TABLE token_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_documents_select ON token_documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_documents.token_id)
    )
  );

CREATE POLICY token_documents_insert ON token_documents
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_documents.token_id)
      AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY token_documents_update ON token_documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_documents.token_id)
      AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY token_documents_delete ON token_documents
  FOR DELETE USING (
    auth.uid() IN (
      SELECT member_id FROM project_members 
      WHERE project_id = (SELECT project_id FROM tokens WHERE id = token_documents.token_id)
      AND role IN ('owner', 'admin', 'editor')
    )
  ); 