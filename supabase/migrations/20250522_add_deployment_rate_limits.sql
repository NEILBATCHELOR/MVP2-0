-- Migration: Add deployment rate limits table
-- This table tracks deployment attempts for rate limiting purposes

-- Create deployment_rate_limits table
CREATE TABLE IF NOT EXISTS public.deployment_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  token_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  
  -- Add metadata for monitoring
  network TEXT,
  environment TEXT,
  
  -- Add foreign key to tokens table
  CONSTRAINT fk_token FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE,
  
  -- Create index for quick lookups
  CONSTRAINT unique_token_deployment UNIQUE (token_id, started_at)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deployment_rate_limits_user_project ON public.deployment_rate_limits (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_deployment_rate_limits_started_at ON public.deployment_rate_limits (started_at);
CREATE INDEX IF NOT EXISTS idx_deployment_rate_limits_status ON public.deployment_rate_limits (status);

-- Add RLS policies
ALTER TABLE public.deployment_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own deployments
CREATE POLICY "Users can view their own deployment rate limits" 
  ON public.deployment_rate_limits 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own deployments
CREATE POLICY "Users can insert their own deployment rate limits" 
  ON public.deployment_rate_limits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own deployments
CREATE POLICY "Users can update their own deployment rate limits" 
  ON public.deployment_rate_limits 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add token_events table for event monitoring if it doesn't exist
CREATE TABLE IF NOT EXISTS public.token_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Add foreign key to tokens table
  CONSTRAINT fk_token FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE
);

-- Add indexes for token_events
CREATE INDEX IF NOT EXISTS idx_token_events_token_id ON public.token_events (token_id);
CREATE INDEX IF NOT EXISTS idx_token_events_event_type ON public.token_events (event_type);
CREATE INDEX IF NOT EXISTS idx_token_events_timestamp ON public.token_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_token_events_is_read ON public.token_events (is_read);

-- Add RLS policies for token_events
ALTER TABLE public.token_events ENABLE ROW LEVEL SECURITY;

-- Add policy for selecting token events
CREATE POLICY "Users can view token events for their projects" 
  ON public.token_events 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.tokens t
      JOIN public.projects p ON t.project_id = p.id
      WHERE t.id = token_id AND (
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = p.id) OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- Add policy for inserting token events
CREATE POLICY "Users can insert token events for their projects" 
  ON public.token_events 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tokens t
      JOIN public.projects p ON t.project_id = p.id
      WHERE t.id = token_id AND (
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = p.id) OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- Add policy for updating token events
CREATE POLICY "Users can update token events for their projects" 
  ON public.token_events 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.tokens t
      JOIN public.projects p ON t.project_id = p.id
      WHERE t.id = token_id AND (
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = p.id) OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- Update tokens table to add verification_status and deployment_transaction fields if they don't exist
DO $$
BEGIN
  -- Add verification_status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'verification_status') THEN
    ALTER TABLE public.tokens ADD COLUMN verification_status TEXT;
  END IF;
  
  -- Add deployment_transaction if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'deployment_transaction') THEN
    ALTER TABLE public.tokens ADD COLUMN deployment_transaction TEXT;
  END IF;
  
  -- Add verification_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'verification_id') THEN
    ALTER TABLE public.tokens ADD COLUMN verification_id TEXT;
  END IF;
  
  -- Add verification_timestamp if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'verification_timestamp') THEN
    ALTER TABLE public.tokens ADD COLUMN verification_timestamp TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add verification_error if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens' AND column_name = 'verification_error') THEN
    ALTER TABLE public.tokens ADD COLUMN verification_error TEXT;
  END IF;
END $$;