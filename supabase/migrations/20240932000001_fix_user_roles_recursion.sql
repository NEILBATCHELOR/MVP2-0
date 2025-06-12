-- Fix infinite recursion in user_roles policy

-- Drop any existing policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can manage their own roles" ON user_roles;

-- Create simplified policies without recursion
CREATE POLICY "Anyone can view roles"
  ON user_roles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update roles"
  ON user_roles FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete roles"
  ON user_roles FOR DELETE
  USING (true);
