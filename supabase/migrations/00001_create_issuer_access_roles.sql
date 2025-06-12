-- Create enum for role types
CREATE TYPE issuer_role AS ENUM (
  'admin',
  'editor',
  'viewer',
  'compliance_officer'
);

-- Create issuer_access_roles table
CREATE TABLE issuer_access_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role issuer_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Ensure unique user-issuer combinations
  UNIQUE(issuer_id, user_id)
);

-- Create indexes
CREATE INDEX idx_issuer_access_roles_issuer_id ON issuer_access_roles(issuer_id);
CREATE INDEX idx_issuer_access_roles_user_id ON issuer_access_roles(user_id);
CREATE INDEX idx_issuer_access_roles_role ON issuer_access_roles(role);

-- Add RLS policies
ALTER TABLE issuer_access_roles ENABLE ROW LEVEL SECURITY;

-- Policy for viewing roles
CREATE POLICY "Users can view roles for their issuers" ON issuer_access_roles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = issuer_access_roles.issuer_id
    )
  );

-- Policy for managing roles (admin only)
CREATE POLICY "Admins can manage roles" ON issuer_access_roles
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = issuer_access_roles.issuer_id 
      AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_issuer_access_roles_updated_at
  BEFORE UPDATE ON issuer_access_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();