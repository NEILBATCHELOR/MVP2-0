-- Create storage bucket for issuer documents
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'issuer-documents',
  'issuer-documents',
  false -- Set to false for private access
);

-- Set up storage policies
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'issuer-documents' AND
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = (SELECT issuer_id FROM issuer_documents WHERE file_url = name)
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can view their documents" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'issuer-documents' AND
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = (SELECT issuer_id FROM issuer_documents WHERE file_url = name)
    )
  );

CREATE POLICY "Users can update their documents" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'issuer-documents' AND
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = (SELECT issuer_id FROM issuer_documents WHERE file_url = name)
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can delete their documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'issuer-documents' AND
    auth.uid() IN (
      SELECT user_id FROM issuer_access_roles 
      WHERE issuer_id = (SELECT issuer_id FROM issuer_documents WHERE file_url = name)
      AND role IN ('admin', 'editor')
    )
  );