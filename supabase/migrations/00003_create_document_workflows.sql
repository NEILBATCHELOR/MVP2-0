-- Create enum for workflow status
CREATE TYPE workflow_status AS ENUM (
  'pending',
  'completed',
  'rejected'
);

-- Create document_workflows table
CREATE TABLE document_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES issuer_documents(id) ON DELETE CASCADE,
  required_signers UUID[] NOT NULL,
  completed_signers UUID[] NOT NULL DEFAULT '{}',
  status workflow_status NOT NULL DEFAULT 'pending',
  deadline TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT valid_deadline CHECK (deadline > created_at),
  CONSTRAINT valid_signers CHECK (
    array_length(completed_signers, 1) <= array_length(required_signers, 1) AND
    completed_signers <@ required_signers
  )
);

-- Create indexes
CREATE INDEX idx_document_workflows_document_id ON document_workflows(document_id);
CREATE INDEX idx_document_workflows_status ON document_workflows(status);

-- Add RLS policies
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;

-- Policy for viewing workflows
CREATE POLICY "Users can view workflows they are involved in" ON document_workflows
  FOR SELECT
  USING (
    auth.uid() = ANY(required_signers) OR
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = (
        SELECT issuer_id FROM issuer_documents 
        WHERE id = document_workflows.document_id
      )
    )
  );

-- Policy for inserting workflows
CREATE POLICY "Users can create workflows for their documents" ON document_workflows
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = (
        SELECT issuer_id FROM issuer_documents 
        WHERE id = document_workflows.document_id
      )
      AND role IN ('admin', 'editor')
    )
  );

-- Policy for updating workflows
CREATE POLICY "Users can update workflows they are involved in" ON document_workflows
  FOR UPDATE
  USING (
    auth.uid() = ANY(required_signers) OR
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = (
        SELECT issuer_id FROM issuer_documents 
        WHERE id = document_workflows.document_id
      )
      AND role IN ('admin', 'editor')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_document_workflows_updated_at
  BEFORE UPDATE ON document_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();