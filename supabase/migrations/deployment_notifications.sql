-- Migration for deployment notifications and token contract events tracking
-- This extends the token_deployment_fields.sql migration

-- Create deployment notifications table
CREATE TABLE IF NOT EXISTS deployment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'deployment_started',
      'deployment_progress', 
      'deployment_success', 
      'deployment_failed', 
      'contract_event'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'pending', 
      'deploying', 
      'success', 
      'failed', 
      'aborted'
    )
  ),
  transaction_hash TEXT,
  contract_address TEXT,
  blockchain TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create token contract events table for tracking events emitted by deployed contracts
CREATE TABLE IF NOT EXISTS token_contract_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  data JSONB DEFAULT '{}',
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_deployment_notifications_token_id 
ON deployment_notifications(token_id);

CREATE INDEX IF NOT EXISTS idx_deployment_notifications_user_id 
ON deployment_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_deployment_notifications_read 
ON deployment_notifications(read);

CREATE INDEX IF NOT EXISTS idx_token_contract_events_token_id 
ON token_contract_events(token_id);

CREATE INDEX IF NOT EXISTS idx_token_contract_events_contract_address 
ON token_contract_events(contract_address);

CREATE INDEX IF NOT EXISTS idx_token_contract_events_event_name 
ON token_contract_events(event_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for deployment_notifications
CREATE TRIGGER update_deployment_notifications_updated_at
BEFORE UPDATE ON deployment_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for token_contract_events
CREATE TRIGGER update_token_contract_events_updated_at
BEFORE UPDATE ON token_contract_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for security
ALTER TABLE deployment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_contract_events ENABLE ROW LEVEL SECURITY;

-- Policies for deployment_notifications
CREATE POLICY select_deployment_notifications
ON deployment_notifications
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = deployment_notifications.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY insert_deployment_notifications
ON deployment_notifications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = deployment_notifications.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY update_deployment_notifications
ON deployment_notifications
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = deployment_notifications.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'editor')
  )
);

-- Policies for token_contract_events
CREATE POLICY select_token_contract_events
ON token_contract_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = token_contract_events.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY insert_token_contract_events
ON token_contract_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = token_contract_events.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'editor')
  )
);

CREATE POLICY update_token_contract_events
ON token_contract_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = token_contract_events.project_id AND pm.user_id = auth.uid() AND pm.role IN ('admin', 'editor')
  )
);