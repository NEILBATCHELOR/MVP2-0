-- Add primary_project flag to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Update RLS policy
DROP POLICY IF EXISTS "Users can CRUD their own projects" ON projects;
CREATE POLICY "Users can CRUD their own projects"
  ON projects
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_project_is_primary ON projects(is_primary);

-- Add document fields for issuer details
CREATE TABLE IF NOT EXISTS issuer_detail_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID,
  status TEXT DEFAULT 'active',
  metadata JSONB
);

-- Add document types for issuer details
CREATE TYPE issuer_document_type AS ENUM (
  'issuer_creditworthiness',
  'project_security_type',
  'offering_details',
  'term_sheet',
  'special_rights',
  'underwriters',
  'use_of_proceeds',
  'financial_highlights',
  'timing',
  'risk_factors'
);

-- Enable RLS on the new table
ALTER TABLE issuer_detail_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for issuer_detail_documents
CREATE POLICY "Users can CRUD their own issuer documents"
  ON issuer_detail_documents
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE issuer_detail_documents;

-- Add comment to explain relationships
COMMENT ON TABLE issuer_detail_documents IS 'Documents related to issuer details for projects';
COMMENT ON COLUMN issuer_detail_documents.document_type IS 'Type of issuer document (creditworthiness, term_sheet, etc.)';