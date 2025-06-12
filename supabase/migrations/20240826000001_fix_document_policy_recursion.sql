-- Drop the problematic policy that's causing recursion
DROP POLICY IF EXISTS "Investors can access public documents" ON issuer_detail_documents;

-- Create a new policy without the recursive reference
CREATE POLICY "Investors can access public documents" 
ON issuer_detail_documents
FOR SELECT
USING (
  is_public = TRUE 
  OR 
  auth.uid()::text = uploaded_by::text
);

-- Alternative policy if the above doesn't work
-- This policy will simply allow all authenticated users to view public documents
-- DROP POLICY IF EXISTS "Public documents are visible to all" ON issuer_detail_documents;
-- CREATE POLICY "Public documents are visible to all" 
-- ON issuer_detail_documents
-- FOR SELECT
-- USING (
--   is_public = TRUE
-- );

-- DROP POLICY IF EXISTS "Documents are visible to uploaders" ON issuer_detail_documents;
-- CREATE POLICY "Documents are visible to uploaders" 
-- ON issuer_detail_documents
-- FOR SELECT
-- USING (
--   auth.uid()::text = uploaded_by::text
-- );