-- Completely disable RLS for user_roles table to fix infinite recursion

-- First drop all existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can manage their own roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can update roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can delete roles" ON user_roles;

-- Disable RLS completely for this table
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Create a trigger to handle cascading deletes
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete from user_roles
  DELETE FROM user_roles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_delete ON users;
CREATE TRIGGER on_user_delete
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Create a simple policy just in case RLS gets re-enabled
CREATE POLICY "Unrestricted access to user_roles"
  ON user_roles
  USING (true);
