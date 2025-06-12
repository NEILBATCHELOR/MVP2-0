-- Fix the log_user_action function to properly handle the audit_logs table
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
  ELSIF TG_TABLE_NAME = 'projects' THEN
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
    old_data
  ) VALUES (
    TG_OP,
    coalesce(auth.uid()::text, 'system'),
    'Action performed on ' || TG_TABLE_NAME,
    'Success',
    entity_type,
    entity_id,
    old_data
  );
  
  RETURN NULL;
END;
$function$;

-- Drop and recreate the trigger on investors table
DROP TRIGGER IF EXISTS log_investor_changes ON investors;

CREATE TRIGGER log_investor_changes
AFTER INSERT OR UPDATE OR DELETE ON investors
FOR EACH ROW EXECUTE FUNCTION log_user_action();

-- Enable RLS on audit_logs table and add policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view audit logs
DROP POLICY IF EXISTS "Allow authenticated users to view audit logs" ON audit_logs;
CREATE POLICY "Allow authenticated users to view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow service role to insert audit logs
DROP POLICY IF EXISTS "Allow service role to insert audit logs" ON audit_logs;
CREATE POLICY "Allow service role to insert audit logs"
ON audit_logs FOR INSERT
TO service_role
WITH CHECK (true);
