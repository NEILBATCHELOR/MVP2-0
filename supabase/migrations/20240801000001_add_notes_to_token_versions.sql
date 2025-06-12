-- Add 'notes' column to token_versions table
ALTER TABLE public.token_versions ADD COLUMN IF NOT EXISTS notes text;

-- Add an index on the token_id and version columns for faster querying of version history
CREATE INDEX IF NOT EXISTS idx_token_versions_token_id_version ON public.token_versions (token_id, version);