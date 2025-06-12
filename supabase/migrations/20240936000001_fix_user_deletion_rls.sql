-- Drop existing RLS policies for users table
DROP POLICY IF EXISTS "Users can be deleted by admins" ON users;
DROP POLICY IF EXISTS "Users can be deleted by superadmins" ON users;

-- Create new RLS policy for user deletion
CREATE POLICY "Users can be deleted by admins"
ON users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'superAdmin')
  )
  OR (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' IN ('admin', 'superAdmin')
    )
  )
);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT DELETE ON users TO authenticated;

-- Create function to handle user deletion with elevated privileges
DROP FUNCTION IF EXISTS delete_user_with_privileges(UUID);

CREATE OR REPLACE FUNCTION delete_user_with_privileges(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from user_roles first
  DELETE FROM user_roles WHERE user_id = $1;
  
  -- Delete from users table
  DELETE FROM users WHERE id = $1;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_user_with_privileges TO authenticated; 