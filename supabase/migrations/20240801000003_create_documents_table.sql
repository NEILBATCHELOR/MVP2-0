-- Create documents table for storing document metadata

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  date_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  rejection_reason TEXT,
  file_url TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
