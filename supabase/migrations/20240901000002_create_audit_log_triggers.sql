-- Create a function to log user actions
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  action_details JSONB;
  user_id UUID;
BEGIN
  -- Determine the action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
  END IF;

  -- Get the current user ID from the auth context
  user_id := auth.uid();
  
  -- Create action details
  IF TG_OP = 'INSERT' THEN
    action_details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_details := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'changed_fields', (SELECT jsonb_object_agg(key, value) FROM jsonb_each(to_jsonb(NEW)) 
                         WHERE to_jsonb(NEW) -> key <> to_jsonb(OLD) -> key)
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_details := to_jsonb(OLD);
  END IF;

  -- Insert into audit_logs table
  INSERT INTO audit_logs (
    action,
    username,
    details,
    status,
    timestamp,
    entity_id,
    entity_type
  ) VALUES (
    action_type || '_' || TG_TABLE_NAME,
    COALESCE((SELECT email FROM auth.users WHERE id = user_id), 'system'),
    action_details::text,
    'Success',
    NOW(),
    CASE 
      WHEN TG_OP = 'DELETE' THEN (OLD.id)::text
      ELSE (NEW.id)::text
    END,
    TG_TABLE_NAME
  );

  -- Return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for key tables

-- Investors table
DROP TRIGGER IF EXISTS log_investor_changes ON investors;
CREATE TRIGGER log_investor_changes
  AFTER INSERT OR UPDATE OR DELETE ON investors
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();

-- Projects table
DROP TRIGGER IF EXISTS log_project_changes ON projects;
CREATE TRIGGER log_project_changes
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();

-- Subscriptions table
DROP TRIGGER IF EXISTS log_subscription_changes ON subscriptions;
CREATE TRIGGER log_subscription_changes
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();

-- Token allocations table
DROP TRIGGER IF EXISTS log_token_allocation_changes ON token_allocations;
CREATE TRIGGER log_token_allocation_changes
  AFTER INSERT OR UPDATE OR DELETE ON token_allocations
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();

-- Documents table
DROP TRIGGER IF EXISTS log_document_changes ON documents;
CREATE TRIGGER log_document_changes
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();

-- User roles table
DROP TRIGGER IF EXISTS log_user_role_changes ON user_roles;
CREATE TRIGGER log_user_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();

-- Rules table
DROP TRIGGER IF EXISTS log_rule_changes ON rules;
CREATE TRIGGER log_rule_changes
  AFTER INSERT OR UPDATE OR DELETE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();

-- Redemption requests table
DROP TRIGGER IF EXISTS log_redemption_request_changes ON redemption_requests;
CREATE TRIGGER log_redemption_request_changes
  AFTER INSERT OR UPDATE OR DELETE ON redemption_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_user_action();
