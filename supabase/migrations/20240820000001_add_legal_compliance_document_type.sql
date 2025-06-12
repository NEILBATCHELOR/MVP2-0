-- Add Legal Regulatory Compliance document type
COMMENT ON COLUMN issuer_detail_documents.document_type IS 'Type of issuer document (creditworthiness, term_sheet, legal_regulatory_compliance, etc.)';

-- No schema change needed as the column is a text field that accepts any string value
-- This is just documentation for the new valid value

-- Update existing documentation
COMMENT ON TABLE issuer_detail_documents IS 'Documents related to issuer details for projects including legal and regulatory compliance'; 