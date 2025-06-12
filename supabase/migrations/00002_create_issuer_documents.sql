-- Create enum types for document status and type
CREATE TYPE document_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE document_type AS ENUM (
  'commercial_register',
  'certificate_incorporation',
  'memorandum_articles',
  'director_list',
  'shareholder_register',
  'financial_statements',
  'regulatory_status',
  'qualification_summary',
  'business_description',
  'organizational_chart',
  'key_people_cv',
  'aml_kyc_description'
);

-- Create issuer_documents table
CREATE TABLE issuer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT valid_expiry_date CHECK (expires_at > uploaded_at),
  CONSTRAINT valid_review_date CHECK (last_reviewed_at >= uploaded_at)
);

-- Create index for faster lookups
CREATE INDEX idx_issuer_documents_issuer_id ON issuer_documents(issuer_id);
CREATE INDEX idx_issuer_documents_type ON issuer_documents(document_type);
CREATE INDEX idx_issuer_documents_status ON issuer_documents(status);

-- Add RLS policies
ALTER TABLE issuer_documents ENABLE ROW LEVEL SECURITY;

-- Policy for viewing documents
CREATE POLICY "Users can view documents they have access to" ON issuer_documents
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = issuer_documents.issuer_id
    )
  );

-- Policy for inserting documents
CREATE POLICY "Users can insert documents for their issuers" ON issuer_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = issuer_documents.issuer_id 
      AND role IN ('admin', 'editor')
    )
  );

-- Policy for updating documents
CREATE POLICY "Users can update documents for their issuers" ON issuer_documents
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = issuer_documents.issuer_id 
      AND role IN ('admin', 'editor')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_issuer_documents_updated_at
  BEFORE UPDATE ON issuer_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();