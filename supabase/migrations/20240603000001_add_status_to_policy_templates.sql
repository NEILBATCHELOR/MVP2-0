-- Add status column to policy_templates table
ALTER TABLE policy_templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_policy_templates_status ON policy_templates(status);

-- Add comment to column
COMMENT ON COLUMN policy_templates.status IS 'Status of the template (active, inactive)';