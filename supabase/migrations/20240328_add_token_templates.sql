-- Add token_templates table for storing reusable token configurations
CREATE TABLE public.token_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  project_id uuid NOT NULL,
  standard text NOT NULL,
  blocks jsonb NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT token_templates_pkey PRIMARY KEY (id),
  CONSTRAINT token_templates_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT token_templates_standard_check CHECK (
    standard = ANY (ARRAY['ERC-20'::text, 'ERC-721'::text, 'ERC-1155'::text, 'ERC-1400'::text, 'ERC-3525'::text, 'ERC-4626'::text])
  )
);

-- Add index on project_id for better query performance
CREATE INDEX idx_token_templates_project_id ON public.token_templates USING btree (project_id);

-- Create trigger to update the updated_at timestamp automatically
CREATE TRIGGER update_token_templates_updated_at
BEFORE UPDATE ON token_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create audit logging trigger
CREATE TRIGGER log_token_template_changes
AFTER INSERT OR UPDATE OR DELETE ON token_templates
FOR EACH ROW
EXECUTE FUNCTION log_user_action();

-- Add template_id to tokens table to track which template was used
ALTER TABLE public.tokens 
ADD COLUMN template_id uuid,
ADD CONSTRAINT tokens_template_id_fkey FOREIGN KEY (template_id) REFERENCES token_templates(id) ON DELETE SET NULL; 