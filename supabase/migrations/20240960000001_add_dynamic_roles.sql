-- Make the user_roles table more flexible by allowing any role from the roles table
-- This addresses the "user_roles_role_check" constraint violation error

-- First, drop the existing constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Create a function to dynamically validate that roles exist in the roles table
CREATE OR REPLACE FUNCTION check_role_exists() RETURNS TRIGGER AS $$
BEGIN
  -- Check if the role exists in the roles table
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = NEW.role) THEN
    RAISE EXCEPTION 'Role "%" does not exist in the roles table', NEW.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS validate_role_exists ON user_roles;

-- Create a trigger to validate roles against the roles table
CREATE TRIGGER validate_role_exists
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION check_role_exists();

-- Update any functions that reference the user_roles check constraint
-- Ensure the update_user_role function handles dynamic roles correctly
CREATE OR REPLACE FUNCTION update_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID AS $$
BEGIN
  -- First check if the role exists in roles table
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = p_role) THEN
    RAISE EXCEPTION 'Role "%" does not exist in the roles table', p_role;
  END IF;

  -- Delete any existing roles
  DELETE FROM user_roles WHERE user_id = p_user_id;
  
  -- Add the new role
  INSERT INTO user_roles (user_id, role, created_at, updated_at)
  VALUES (p_user_id, p_role, NOW(), NOW());
END;
$$ LANGUAGE plpgsql; 