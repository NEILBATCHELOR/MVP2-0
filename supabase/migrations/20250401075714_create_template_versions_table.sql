-- Create a table for storing template versions
CREATE TABLE IF NOT EXISTS public.template_versions (
  version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES policy_templates(template_id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  version_data JSONB NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure we can't have duplicate version numbers for the same template
  CONSTRAINT unique_template_version UNIQUE (template_id, version)
);

-- Add RLS policies
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

-- Create template_versions log trigger
CREATE TRIGGER log_template_version_changes
AFTER INSERT OR DELETE OR UPDATE ON template_versions
FOR EACH ROW EXECUTE FUNCTION log_user_action();