-- Project credentials table
CREATE TABLE IF NOT EXISTS project_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  key_vault_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_credentials_project_id ON project_credentials(project_id);

-- Create audit log table for key usage
CREATE TABLE IF NOT EXISTS credential_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  credential_id UUID NOT NULL REFERENCES project_credentials(id),
  action_type TEXT NOT NULL,
  action_details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for faster audit lookups
CREATE INDEX IF NOT EXISTS idx_credential_usage_logs_credential_id ON credential_usage_logs(credential_id);