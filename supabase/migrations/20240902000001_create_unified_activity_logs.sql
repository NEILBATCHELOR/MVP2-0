-- Create a unified activity logs table that will replace all existing audit/activity logging
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  metadata JSONB
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS activity_logs_timestamp_idx ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_type_idx ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS activity_logs_entity_type_idx ON activity_logs(entity_type);

-- Enable row level security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to see all logs
CREATE POLICY "Admins can see all activity logs"
  ON activity_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create policy for users to see their own logs
CREATE POLICY "Users can see their own activity logs"
  ON activity_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- Create a function to log activities automatically
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  entity_type TEXT;
  entity_id TEXT;
  details JSONB;
BEGIN
  -- Determine action type based on operation
  IF TG_OP = 'INSERT' THEN
    action_type := 'create_' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update_' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete_' || TG_TABLE_NAME;
  END IF;
  
  -- Set entity type to table name
  entity_type := TG_TABLE_NAME;
  
  -- Get entity ID (assuming most tables have an id column)
  IF TG_OP = 'DELETE' THEN
    -- For DELETE operations, use OLD
    IF OLD ? 'id' THEN
      entity_id := OLD->>'id';
    ELSIF OLD ? 'investor_id' THEN
      entity_id := OLD->>'investor_id';
    ELSIF OLD ? 'project_id' THEN
      entity_id := OLD->>'project_id';
    END IF;
    details := to_jsonb(OLD);
  ELSE
    -- For INSERT and UPDATE operations, use NEW
    IF NEW ? 'id' THEN
      entity_id := NEW->>'id';
    ELSIF NEW ? 'investor_id' THEN
      entity_id := NEW->>'investor_id';
    ELSIF NEW ? 'project_id' THEN
      entity_id := NEW->>'project_id';
    END IF;
    details := to_jsonb(NEW);
  END IF;
  
  -- Insert into activity_logs
  INSERT INTO activity_logs (
    user_id,
    user_email,
    action_type,
    entity_type,
    entity_id,
    details,
    status
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    action_type,
    entity_type,
    entity_id,
    details,
    'success'
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing audit log triggers if they exist
DROP TRIGGER IF EXISTS audit_log_trigger ON audit_logs;

-- Create a helper function to add activity log triggers to tables
CREATE OR REPLACE FUNCTION add_activity_log_trigger(table_name text)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS activity_log_trigger ON %I', table_name);
  EXECUTE format('
    CREATE TRIGGER activity_log_trigger
    AFTER INSERT OR UPDATE OR DELETE ON %I
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();
  ', table_name);
END;
$$ LANGUAGE plpgsql;

-- Add triggers to important tables
SELECT add_activity_log_trigger('investors');
SELECT add_activity_log_trigger('subscriptions');
SELECT add_activity_log_trigger('token_allocations');
SELECT add_activity_log_trigger('projects');
SELECT add_activity_log_trigger('redemption_requests');
SELECT add_activity_log_trigger('user_roles');
SELECT add_activity_log_trigger('rules');
