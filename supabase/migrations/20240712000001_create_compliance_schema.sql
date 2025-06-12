-- Create audit_logs table for tracking all actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  details TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on project_id and timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_timestamp ON audit_logs(project_id, timestamp DESC);

-- Create compliance_checks table for tracking investor risk levels
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(investor_id, project_id)
);

-- Create index on project_id and risk_level for faster queries
CREATE INDEX IF NOT EXISTS idx_compliance_checks_project_risk ON compliance_checks(project_id, risk_level);

-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'compliance_officer', 'issuer', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable row-level security on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit_logs
CREATE POLICY "Users can view audit logs for their projects" 
  ON audit_logs FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'compliance_officer', 'issuer')
  ));

-- Enable row-level security on compliance_checks
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for compliance_checks
CREATE POLICY "Users can view compliance checks" 
  ON compliance_checks FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'compliance_officer', 'issuer')
  ));

CREATE POLICY "Only compliance officers can update high-risk investors" 
  ON compliance_checks FOR UPDATE 
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('admin', 'compliance_officer')
  ));

-- Add realtime publication for audit_logs and compliance_checks
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE compliance_checks;
