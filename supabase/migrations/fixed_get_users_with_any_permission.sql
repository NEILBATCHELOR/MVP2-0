-- Function to get users with any of the specified permissions
CREATE OR REPLACE FUNCTION get_users_with_any_permission(permission_names text[])
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  role text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id as user_id,
    u.name,
    u.email,
    r.name as role
  FROM auth.users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  WHERE 
    rp.permission_name = ANY(permission_names) AND
    u.deleted_at IS NULL
  ORDER BY u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;