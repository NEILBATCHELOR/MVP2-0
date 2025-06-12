-- Create enum for compliance status
CREATE TYPE compliance_status AS ENUM (
  'compliant',
  'non_compliant',
  'pending_review'
);

-- Create compliance_reports table
CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status compliance_status NOT NULL DEFAULT 'pending_review',
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_compliance_reports_issuer_id ON compliance_reports(issuer_id);
CREATE INDEX idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX idx_compliance_reports_generated_at ON compliance_reports(generated_at);

-- Add RLS policies
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Policy for viewing reports
CREATE POLICY "Users can view reports for their issuers" ON compliance_reports
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = compliance_reports.issuer_id
    )
  );

-- Policy for inserting reports
CREATE POLICY "Compliance officers can create reports" ON compliance_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = compliance_reports.issuer_id 
      AND role IN ('admin', 'compliance_officer')
    )
  );

-- Policy for updating reports
CREATE POLICY "Compliance officers can update reports" ON compliance_reports
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = compliance_reports.issuer_id 
      AND role IN ('admin', 'compliance_officer')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_compliance_reports_updated_at
  BEFORE UPDATE ON compliance_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();