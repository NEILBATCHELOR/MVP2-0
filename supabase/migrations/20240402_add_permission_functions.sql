-- Function to check if a role has a specific permission
CREATE OR REPLACE FUNCTION check_permission(
  p_role_name TEXT,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
  v_has_permission BOOLEAN;
BEGIN
  -- Get the role ID
  SELECT id INTO v_role_id
  FROM roles
  WHERE name = p_role_name;
  
  -- If role doesn't exist, return false
  IF v_role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE resource = p_resource AND action = p_action;
  
  -- If permission doesn't exist, return false
  IF v_permission_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the role has this permission
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions
    WHERE role_id = v_role_id
      AND permission_id = v_permission_id
      AND effect = 'allow'
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- Function to log an audit entry
CREATE OR REPLACE FUNCTION log_audit(
  p_action TEXT,
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'Success',
  p_metadata JSONB DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_audit_id UUID;
  v_user_email TEXT;
  v_username TEXT;
BEGIN
  -- Get user email and name
  SELECT email, name INTO v_user_email, v_username
  FROM users
  WHERE id = p_user_id;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    action,
    user_id,
    user_email,
    username,
    entity_type,
    entity_id,
    details,
    status,
    metadata,
    old_data,
    new_data
  ) VALUES (
    p_action,
    p_user_id,
    v_user_email,
    v_username,
    p_entity_type,
    p_entity_id,
    p_details,
    p_status,
    p_metadata,
    p_old_data,
    p_new_data
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;