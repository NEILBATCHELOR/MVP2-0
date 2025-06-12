-- Create tables for workflow stages and requirements

-- Workflow stages table
CREATE TABLE IF NOT EXISTS workflow_stages (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stage requirements table
CREATE TABLE IF NOT EXISTS stage_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage_id TEXT NOT NULL REFERENCES workflow_stages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE stage_requirements;
