-- Create policy_templates table
CREATE TABLE IF NOT EXISTS policy_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  template_type TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN template_data->>'type' IS NOT NULL THEN template_data->>'type'
      ELSE 'general'
    END
  ) STORED
);

-- Create indexes for faster querying
CREATE INDEX idx_policy_templates_name ON policy_templates(template_name);
CREATE INDEX idx_policy_templates_type ON policy_templates(template_type);
CREATE INDEX idx_policy_templates_created_at ON policy_templates(created_at DESC);

-- Add comment to table
COMMENT ON TABLE policy_templates IS 'Stores reusable policy templates'; 