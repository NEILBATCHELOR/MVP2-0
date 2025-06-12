-- Migration: Create token_deployment_history table
-- Description: Creates a table to track token deployment history with detailed status information

-- Create the token_deployment_history table
CREATE TABLE IF NOT EXISTS public.token_deployment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL,
  project_id UUID NOT NULL,
  status TEXT NOT NULL,
  transaction_hash TEXT,
  block_number INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  error TEXT,
  blockchain TEXT NOT NULL,
  environment TEXT NOT NULL,
  
  -- Add foreign key constraints
  CONSTRAINT fk_token_id FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_deployment_history_token_id ON public.token_deployment_history(token_id);
CREATE INDEX IF NOT EXISTS idx_token_deployment_history_project_id ON public.token_deployment_history(project_id);
CREATE INDEX IF NOT EXISTS idx_token_deployment_history_status ON public.token_deployment_history(status);
CREATE INDEX IF NOT EXISTS idx_token_deployment_history_timestamp ON public.token_deployment_history(timestamp);

-- Add comment to table
COMMENT ON TABLE public.token_deployment_history IS 'Records the history of token deployment attempts and their status';

-- Grant permissions
ALTER TABLE public.token_deployment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY select_token_deployment_history ON public.token_deployment_history
  FOR SELECT USING (true);

CREATE POLICY insert_token_deployment_history ON public.token_deployment_history
  FOR INSERT WITH CHECK (auth.uid() = ANY(SELECT user_id FROM project_members WHERE project_id = token_deployment_history.project_id));

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.token_deployment_history TO authenticated; 