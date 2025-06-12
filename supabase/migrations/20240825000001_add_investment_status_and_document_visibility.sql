-- Add investment_status column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS investment_status TEXT NOT NULL DEFAULT 'Open' CHECK (investment_status IN ('Open', 'Closed'));

-- Add is_public column to issuer_detail_documents table for controlling investor visibility
ALTER TABLE issuer_detail_documents
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN projects.investment_status IS 'Indicates whether the project is open or closed for investment';
COMMENT ON COLUMN issuer_detail_documents.is_public IS 'Controls whether the document is visible to investors in the investor portal';

-- Update RLS policies for issuer_detail_documents if they exist
-- This assumes you have existing RLS policies that need to be updated
-- You may need to adjust this based on your actual RLS setup

-- Enable row level security if not already enabled
ALTER TABLE issuer_detail_documents ENABLE ROW LEVEL SECURITY;

-- Create or replace policy for investor access to documents
DROP POLICY IF EXISTS "Investors can access public documents" ON issuer_detail_documents;
CREATE POLICY "Investors can access public documents" 
ON issuer_detail_documents
FOR SELECT
USING (
  is_public = TRUE 
  OR 
  auth.uid() IN (
    SELECT uploaded_by FROM issuer_detail_documents WHERE id = issuer_detail_documents.id
  )
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE issuer_detail_documents;