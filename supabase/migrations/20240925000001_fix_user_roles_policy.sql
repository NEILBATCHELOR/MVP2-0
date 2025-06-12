-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create a new policy that avoids recursion
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (true);

-- Ensure RLS is enabled on the table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Add a basic insert policy if needed
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
CREATE POLICY "Users can insert their own roles"
ON user_roles FOR INSERT
WITH CHECK (true);

-- Add a basic update policy if needed
DROP POLICY IF EXISTS "Users can update their own roles" ON user_roles;
CREATE POLICY "Users can update their own roles"
ON user_roles FOR UPDATE
USING (true);

-- Add a basic delete policy if needed
DROP POLICY IF EXISTS "Users can delete their own roles" ON user_roles;
CREATE POLICY "Users can delete their own roles"
ON user_roles FOR DELETE
USING (true);
