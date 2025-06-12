-- Add indexes to policy_templates table to improve query performance
CREATE INDEX IF NOT EXISTS idx_policy_templates_template_name ON public.policy_templates (template_name);
CREATE INDEX IF NOT EXISTS idx_policy_templates_created_by ON public.policy_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_policy_templates_created_at ON public.policy_templates (created_at);

-- Ensure policy_templates has a rule type field for better search
CREATE OR REPLACE FUNCTION extract_template_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract policy type from template data and create a searchable field
  -- This allows for better filtering of templates by type
  IF NEW.template_data ? 'type' THEN
    NEW.template_type = NEW.template_data->>'type';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- First add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'policy_templates' 
    AND column_name = 'template_type'
  ) THEN
    ALTER TABLE public.policy_templates ADD COLUMN template_type TEXT;
  END IF;
END $$;

-- Create the trigger on the policy_templates table
DROP TRIGGER IF EXISTS update_template_type ON public.policy_templates;
CREATE TRIGGER update_template_type
BEFORE INSERT OR UPDATE ON public.policy_templates
FOR EACH ROW
EXECUTE FUNCTION extract_template_type();