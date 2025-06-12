-- Add template versions table
CREATE TABLE IF NOT EXISTS public.template_versions (
  version_id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  version text NOT NULL,
  version_data jsonb NOT NULL,
  notes text,
  created_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT template_versions_pkey PRIMARY KEY (version_id),
  CONSTRAINT template_versions_template_id_fkey FOREIGN KEY (template_id)
    REFERENCES public.policy_templates (template_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON public.template_versions USING btree (template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_created_at ON public.template_versions USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_versions_template_version ON public.template_versions USING btree (template_id, version);

-- Add audit trigger for tracking changes
DO $$
BEGIN
  CREATE TRIGGER template_versions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON template_versions
  FOR EACH ROW EXECUTE FUNCTION log_user_action();
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Trigger template_versions_audit_trigger already exists';
END
$$;