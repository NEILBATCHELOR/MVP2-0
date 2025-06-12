-- Fix the log_user_action function to properly handle token_templates table
CREATE OR REPLACE FUNCTION public.log_user_action()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  old_data jsonb := null;
  new_data jsonb := null;
  entity_type text;
  entity_id text;
BEGIN
  -- Set the entity type based on the table name
  entity_type := TG_TABLE_NAME;
  
  -- Handle different tables with different primary key names
  IF TG_TABLE_NAME = 'investors' THEN
    IF TG_OP = 'DELETE' THEN
      entity_id := old.investor_id::text;
      old_data := row_to_json(old)::jsonb;
    ELSE
      entity_id := new.investor_id::text;
      IF TG_OP = 'UPDATE' THEN
        old_data := row_to_json(old)::jsonb;
      END IF;
      new_data := row_to_json(new)::jsonb;
    END IF;
  ELSIF TG_TABLE_NAME = 'token_templates' OR TG_TABLE_NAME = 'projects' OR TG_TABLE_NAME = 'tokens' THEN
    -- Handle token_templates, projects, and tokens tables which should use id field
    IF TG_OP = 'DELETE' THEN
      entity_id := old.id::text;
      old_data := row_to_json(old)::jsonb;
    ELSE
      entity_id := new.id::text;
      IF TG_OP = 'UPDATE' THEN
        old_data := row_to_json(old)::jsonb;
      END IF;
      new_data := row_to_json(new)::jsonb;
    END IF;
  ELSE
    -- Default case for other tables
    IF TG_OP = 'DELETE' THEN
      entity_id := old.id::text;
      old_data := row_to_json(old)::jsonb;
    ELSE
      entity_id := new.id::text;
      IF TG_OP = 'UPDATE' THEN
        old_data := row_to_json(old)::jsonb;
      END IF;
      new_data := row_to_json(new)::jsonb;
    END IF;
  END IF;
  
  -- Insert the audit log
  INSERT INTO audit_logs (
    action,
    username,
    details,
    status,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    TG_OP,
    coalesce(auth.uid()::text, 'system'),
    'Action performed on ' || TG_TABLE_NAME,
    'Success',
    entity_type,
    entity_id,
    old_data,
    new_data
  );
  
  RETURN NULL;
END;
$function$;

-- Create a comment to explain the fix
COMMENT ON FUNCTION public.log_user_action IS 'This function handles audit logging for various tables, with special handling for token_templates';