-- Enable realtime for cap table related tables
alter publication supabase_realtime add table subscriptions;
alter publication supabase_realtime add table token_allocations;
alter publication supabase_realtime add table investors;
alter publication supabase_realtime add table projects;

-- Create documents table for document management
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES investors(investor_id) ON DELETE SET NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add documents to realtime
alter publication supabase_realtime add table documents;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for documents bucket
CREATE POLICY "Documents are accessible to authenticated users" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Documents can be inserted by authenticated users" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Documents can be updated by authenticated users" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Documents can be deleted by authenticated users" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Create table for bulk operations tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type TEXT NOT NULL,
  target_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  metadata JSONB
);

-- Add bulk operations to realtime
alter publication supabase_realtime add table bulk_operations;
