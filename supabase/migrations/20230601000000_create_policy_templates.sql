-- Create policy_templates table
CREATE TABLE IF NOT EXISTS public.policy_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.policy_templates ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_policy_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_policy_templates_trigger
BEFORE UPDATE ON public.policy_templates
FOR EACH ROW
EXECUTE FUNCTION update_policy_templates_updated_at();

-- Create the policy template log trigger
CREATE TRIGGER log_policy_template_changes
AFTER INSERT OR DELETE OR UPDATE ON policy_templates
FOR EACH ROW EXECUTE FUNCTION log_user_action();